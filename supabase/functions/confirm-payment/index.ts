import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CONFIRM-PAYMENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { payment_intent_id, create_account } = await req.json();

    if (!payment_intent_id) {
      throw new Error("Payment intent ID required");
    }

    logStep("Request parsed", { payment_intent_id, create_account });

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

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status !== "succeeded") {
      throw new Error("Payment not completed");
    }

    logStep("Payment intent verified", { status: paymentIntent.status });

    const productIds = paymentIntent.metadata.product_ids?.split(",") || [];
    const couponCode = paymentIntent.metadata.coupon_code || null;
    const discountAmount = parseInt(paymentIntent.metadata.discount_amount || "0");
    const guestEmail = paymentIntent.metadata.guest_email || null;

    // Get products to determine what was purchased
    const { data: products } = await supabaseClient
      .from("stripe_products")
      .select("*")
      .in("id", productIds);

    if (!products || products.length === 0) {
      throw new Error("Products not found");
    }

    logStep("Products fetched", { count: products.length });

    let userId = null;

    // Handle guest checkout - create account
    if (create_account && guestEmail) {
      logStep("Creating guest account", { email: guestEmail });
      
      // Generate random password
      const password = crypto.randomUUID();
      
      const { data: signUpData, error: signUpError } = await supabaseClient.auth.admin.createUser({
        email: guestEmail,
        password: password,
        email_confirm: true,
      });

      if (signUpError) {
        logStep("Account creation failed", { error: signUpError.message });
      } else {
        userId = signUpData.user.id;
        logStep("Account created", { userId });
      }
    } else {
      // Get authenticated user
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        userId = user?.id || null;
      }
    }

    if (!userId) {
      throw new Error("User ID required to record purchase");
    }

    // Record purchases
    for (const product of products) {
      if (product.product_type === "individual_replay" && product.replay_id) {
        // Check if already exists
        const { data: existing } = await supabaseClient
          .from("replay_purchases")
          .select("id")
          .eq("user_id", userId)
          .eq("replay_id", product.replay_id)
          .maybeSingle();

        if (!existing) {
          await supabaseClient
            .from("replay_purchases")
            .insert({
              user_id: userId,
              replay_id: product.replay_id,
              event_year: product.event_year,
              product_id: product.id,
              stripe_payment_intent: paymentIntent.id,
              coupon_code: couponCode,
              discount_amount: discountAmount,
            });
          
          logStep("Replay purchase recorded", { replay_id: product.replay_id });
        }
      } else if (product.product_type === "year_bundle") {
        // Check if bundle already exists
        const { data: existing } = await supabaseClient
          .from("replay_purchases")
          .select("id")
          .eq("user_id", userId)
          .eq("event_year", product.event_year)
          .is("replay_id", null)
          .maybeSingle();

        if (!existing) {
          await supabaseClient
            .from("replay_purchases")
            .insert({
              user_id: userId,
              replay_id: null,
              event_year: product.event_year,
              product_id: product.id,
              stripe_payment_intent: paymentIntent.id,
              coupon_code: couponCode,
              discount_amount: discountAmount,
            });

          logStep("Bundle purchase recorded", { event_year: product.event_year });
        }
      }
    }

    // Update coupon redemption count
    if (couponCode) {
      await supabaseClient
        .from("stripe_coupons")
        .update({ times_redeemed: supabaseClient.from("stripe_coupons").select("times_redeemed").eq("code", couponCode) })
        .eq("code", couponCode);
    }

    logStep("Purchase confirmation complete");

    return new Response(
      JSON.stringify({
        success: true,
        account_created: create_account && guestEmail ? true : false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
