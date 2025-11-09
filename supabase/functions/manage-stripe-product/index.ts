import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client with anon key for auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Create service role client to check admin status (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Check admin role using service role client
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("Error checking admin role:", roleError);
      throw new Error("Failed to verify admin access");
    }

    if (!roleData) {
      console.log(`User ${user.id} attempted admin action without admin role`);
      throw new Error("Admin access required");
    }

    console.log(`Admin action authorized for user ${user.id}`);

    const { operation, product_id, data: productData } = await req.json();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    console.log(`Managing Stripe product: ${operation}`);

    switch (operation) {
      case "create": {
        // Create Stripe product and price
        const stripeProduct = await stripe.products.create({
          name: productData.product_name,
          metadata: {
            product_type: productData.product_type,
            event_year: productData.event_year.toString(),
            replay_id: productData.replay_id || "",
          },
        });

        const stripePrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: productData.amount,
          currency: productData.currency,
        });

        // Insert into database using admin client
        const { data: dbProduct, error: dbError } = await supabaseAdmin
          .from("stripe_products")
          .insert({
            stripe_product_id: stripeProduct.id,
            stripe_price_id: stripePrice.id,
            product_name: productData.product_name,
            product_type: productData.product_type,
            event_year: productData.event_year,
            replay_id: productData.replay_id || null,
            amount: productData.amount,
            currency: productData.currency,
            active: true,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        console.log(`Created product: ${dbProduct.id}`);
        return new Response(JSON.stringify({ success: true, product: dbProduct }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update": {
        if (!product_id) throw new Error("product_id required for update");

        // Get existing product using admin client
        const { data: existingProduct } = await supabaseAdmin
          .from("stripe_products")
          .select("*")
          .eq("id", product_id)
          .single();

        if (!existingProduct) throw new Error("Product not found");

        // Archive old price in Stripe
        await stripe.prices.update(existingProduct.stripe_price_id, {
          active: false,
        });

        // Create new price
        const newPrice = await stripe.prices.create({
          product: existingProduct.stripe_product_id,
          unit_amount: productData.amount,
          currency: productData.currency,
        });

        // Update product in Stripe if name changed
        if (productData.product_name && productData.product_name !== existingProduct.product_name) {
          await stripe.products.update(existingProduct.stripe_product_id, {
            name: productData.product_name,
          });
        }

        // Update database using admin client
        const { data: updatedProduct, error: updateError } = await supabaseAdmin
          .from("stripe_products")
          .update({
            stripe_price_id: newPrice.id,
            product_name: productData.product_name || existingProduct.product_name,
            amount: productData.amount,
            currency: productData.currency,
          })
          .eq("id", product_id)
          .select()
          .single();

        if (updateError) throw updateError;

        console.log(`Updated product: ${product_id}`);
        return new Response(JSON.stringify({ success: true, product: updatedProduct }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "toggle_active": {
        if (!product_id) throw new Error("product_id required");

        const { data: product, error: fetchError } = await supabaseAdmin
          .from("stripe_products")
          .select("active")
          .eq("id", product_id)
          .single();

        if (fetchError || !product) throw new Error("Product not found");

        const newActiveState = !product.active;

        const { data: updatedProduct, error } = await supabaseAdmin
          .from("stripe_products")
          .update({ active: newActiveState })
          .eq("id", product_id)
          .select()
          .single();

        if (error) throw error;

        console.log(`Toggled product ${product_id} active state to ${newActiveState}`);
        return new Response(JSON.stringify({ success: true, product: updatedProduct }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        if (!product_id) throw new Error("product_id required");

        // Check if product has purchases using admin client
        const { data: purchases } = await supabaseAdmin
          .from("replay_purchases")
          .select("id")
          .eq("product_id", product_id)
          .limit(1);

        if (purchases && purchases.length > 0) {
          throw new Error("Cannot delete product with existing purchases. Deactivate instead.");
        }

        // Get product details using admin client
        const { data: product, error: fetchError } = await supabaseAdmin
          .from("stripe_products")
          .select("stripe_product_id")
          .eq("id", product_id)
          .single();

        if (fetchError || !product) throw new Error("Product not found");

        // Archive in Stripe
        await stripe.products.update(product.stripe_product_id, {
          active: false,
        });

        // Delete from database using admin client
        const { error } = await supabaseAdmin
          .from("stripe_products")
          .delete()
          .eq("id", product_id);

        if (error) throw error;

        console.log(`Deleted product: ${product_id}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "sync": {
        if (!product_id) throw new Error("product_id required");

        const { data: dbProduct, error: fetchError } = await supabaseAdmin
          .from("stripe_products")
          .select("stripe_product_id, stripe_price_id")
          .eq("id", product_id)
          .single();

        if (fetchError || !dbProduct) throw new Error("Product not found");

        const stripeProduct = await stripe.products.retrieve(dbProduct.stripe_product_id);
        const stripePrice = await stripe.prices.retrieve(dbProduct.stripe_price_id);

        const { data: synced, error } = await supabaseAdmin
          .from("stripe_products")
          .update({
            product_name: stripeProduct.name,
            amount: stripePrice.unit_amount,
            active: stripeProduct.active && stripePrice.active,
          })
          .eq("id", product_id)
          .select()
          .single();

        if (error) throw error;

        console.log(`Synced product: ${product_id}`);
        return new Response(JSON.stringify({ success: true, product: synced }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error("Error managing Stripe product:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
