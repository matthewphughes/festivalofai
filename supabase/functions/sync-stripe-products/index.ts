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

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    console.log("Starting Stripe products sync...");

    // Get all products from database
    const { data: dbProducts, error: dbError } = await supabaseClient
      .from("stripe_products")
      .select("*");

    if (dbError) throw dbError;

    let synced = 0;
    let updated = 0;
    const errors: Array<{ product_id: string; error: string }> = [];
    const orphaned: string[] = [];

    for (const dbProduct of dbProducts) {
      try {
        // Fetch from Stripe
        const stripeProduct = await stripe.products.retrieve(dbProduct.stripe_product_id);
        const stripePrice = await stripe.prices.retrieve(dbProduct.stripe_price_id);

        // Check if data needs updating
        const needsUpdate = 
          dbProduct.product_name !== stripeProduct.name ||
          dbProduct.amount !== stripePrice.unit_amount ||
          dbProduct.active !== (stripeProduct.active && stripePrice.active);

        if (needsUpdate) {
          const { error: updateError } = await supabaseClient
            .from("stripe_products")
            .update({
              product_name: stripeProduct.name,
              amount: stripePrice.unit_amount || 0,
              active: stripeProduct.active && stripePrice.active,
            })
            .eq("id", dbProduct.id);

          if (updateError) throw updateError;
          updated++;
        }

        synced++;
      } catch (error) {
        const isNotFound = (error as any).statusCode === 404;
        if (isNotFound) {
          // Product doesn't exist in Stripe anymore
          orphaned.push(dbProduct.id);
        } else {
          errors.push({
            product_id: dbProduct.id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    console.log(`Sync complete: ${synced} synced, ${updated} updated, ${orphaned.length} orphaned`);

    return new Response(
      JSON.stringify({
        success: true,
        synced,
        updated,
        orphaned,
        errors,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error syncing Stripe products:", error);
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
