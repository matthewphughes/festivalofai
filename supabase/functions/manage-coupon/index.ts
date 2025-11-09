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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user and check admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    const { operation, coupon_id, data: couponData } = await req.json();

    // Check test mode
    const { data: testModeSetting } = await supabaseClient
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "stripe_test_mode")
      .single();

    const isTestMode = testModeSetting?.setting_value === "true";
    const stripeKey = isTestMode 
      ? Deno.env.get("STRIPE_TEST_SECRET_KEY") 
      : Deno.env.get("STRIPE_SECRET_KEY");

    const stripe = new Stripe(stripeKey || "", {
      apiVersion: "2025-08-27.basil",
    });

    console.log(`Managing coupon: ${operation}`);

    switch (operation) {
      case "create": {
        // Create coupon in Stripe
        const stripeCoupon = await stripe.coupons.create({
          name: couponData.code,
          ...(couponData.discount_type === "percentage" 
            ? { percent_off: couponData.discount_value }
            : { amount_off: couponData.discount_value, currency: couponData.currency }),
          max_redemptions: couponData.max_redemptions || undefined,
        });

        // Insert into database
        const { data: dbCoupon, error: dbError } = await supabaseClient
          .from("stripe_coupons")
          .insert({
            stripe_coupon_id: stripeCoupon.id,
            code: couponData.code.toUpperCase(),
            discount_type: couponData.discount_type,
            discount_value: couponData.discount_value,
            currency: couponData.currency || "gbp",
            max_redemptions: couponData.max_redemptions || null,
            valid_from: couponData.valid_from || null,
            valid_until: couponData.valid_until || null,
            active: true,
            product_id: couponData.product_id || null,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        console.log(`Created coupon: ${dbCoupon.id}`);
        return new Response(JSON.stringify({ success: true, coupon: dbCoupon }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "toggle_active": {
        if (!coupon_id) throw new Error("coupon_id required");

        const { data: coupon, error: fetchError } = await supabaseClient
          .from("stripe_coupons")
          .select("active")
          .eq("id", coupon_id)
          .single();

        if (fetchError || !coupon) throw new Error("Coupon not found");

        const newActiveState = !coupon.active;

        const { data: updated, error } = await supabaseClient
          .from("stripe_coupons")
          .update({ active: newActiveState })
          .eq("id", coupon_id)
          .select()
          .single();

        if (error) throw error;

        console.log(`Toggled coupon ${coupon_id} active state to ${newActiveState}`);
        return new Response(JSON.stringify({ success: true, coupon: updated }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        if (!coupon_id) throw new Error("coupon_id required");

        const { error } = await supabaseClient
          .from("stripe_coupons")
          .delete()
          .eq("id", coupon_id);

        if (error) throw error;

        console.log(`Deleted coupon: ${coupon_id}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error) {
    console.error("Error managing coupon:", error);
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
