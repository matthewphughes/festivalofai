import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      logStep("ERROR: Authentication failed", { error: userError.message });
      throw new Error(`Authentication error: ${userError.message}`);
    }

    const user = data.user;
    if (!user?.email) {
      logStep("ERROR: User not authenticated or email not available");
      throw new Error("User not authenticated or email not available");
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get the product_id from request body
    const { product_id } = await req.json();
    if (!product_id) {
      logStep("ERROR: No product_id provided");
      throw new Error("product_id is required");
    }

    logStep("Product ID received", { product_id });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Look up product from database
    const { data: product, error: productError } = await supabaseClient
      .from("stripe_products")
      .select("*")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      logStep("ERROR: Product not found", { product_id });
      throw new Error("Product not found");
    }

    if (!product.active) {
      logStep("ERROR: Product is not active", { product_id });
      throw new Error("Product is not active");
    }

    logStep("Product found", { 
      productName: product.product_name, 
      amount: product.amount,
      type: product.product_type 
    });


    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    } else {
      logStep("No existing Stripe customer found");
    }

    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: product.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/replays?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/replays`,
      metadata: {
        product_id: product_id,
        product_type: product.product_type,
        event_year: product.event_year.toString(),
        replay_id: product.replay_id || "",
        user_id: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
