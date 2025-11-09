import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CREATE-PAYMENT-INTENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get request body
    const { product_ids, coupon_code, guest_email } = await req.json();
    
    if (!product_ids || product_ids.length === 0) {
      throw new Error("No products provided");
    }

    logStep("Request parsed", { product_ids, coupon_code, guest_email });

    // Authenticate user (optional for guest checkout)
    let userEmail = guest_email;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      if (user?.email) {
        userEmail = user.email;
      }
    }

    if (!userEmail) {
      throw new Error("Email is required for checkout");
    }

    logStep("User identified", { userEmail });

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

    logStep("Stripe mode", { isTestMode });

    const stripe = new Stripe(stripeKey || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Fetch products from database
    const { data: products, error: productsError } = await supabaseClient
      .from("stripe_products")
      .select("*")
      .in("id", product_ids)
      .eq("active", true);

    if (productsError || !products || products.length === 0) {
      throw new Error("Products not found or inactive");
    }

    logStep("Products fetched", { count: products.length });

    // Calculate total amount
    let totalAmount = products.reduce((sum, p) => sum + p.amount, 0);
    let discountAmount = 0;
    let validCoupon = null;

    // Apply coupon if provided
    if (coupon_code) {
      const { data: coupon } = await supabaseClient
        .from("stripe_coupons")
        .select("*")
        .eq("code", coupon_code.toUpperCase())
        .eq("active", true)
        .single();

      if (coupon) {
        const now = new Date();
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

        const isValid = 
          (!validFrom || now >= validFrom) &&
          (!validUntil || now <= validUntil) &&
          (!coupon.max_redemptions || coupon.times_redeemed < coupon.max_redemptions);

        if (isValid) {
          validCoupon = coupon;
          if (coupon.discount_type === "percentage") {
            discountAmount = Math.floor(totalAmount * (coupon.discount_value / 100));
          } else {
            discountAmount = Math.min(coupon.discount_value, totalAmount);
          }
          totalAmount -= discountAmount;
          logStep("Coupon applied", { code: coupon_code, discount: discountAmount });
        }
      }
    }

    // Check if customer exists
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({ email: userEmail });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: products[0].currency,
      customer: customerId,
      metadata: {
        product_ids: product_ids.join(","),
        coupon_code: validCoupon?.code || "",
        discount_amount: discountAmount.toString(),
        guest_email: guest_email || "",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logStep("Payment intent created", { 
      paymentIntentId: paymentIntent.id,
      amount: totalAmount 
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        amount: totalAmount,
        discount: discountAmount,
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
