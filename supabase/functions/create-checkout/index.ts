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

    // Get priceId from request body
    const { priceId, product_id } = await req.json();
    
    // Support both priceId (direct price ID) and product_id (lookup from database)
    if (!priceId && !product_id) {
      logStep("ERROR: Neither priceId nor product_id provided");
      throw new Error("Either priceId or product_id is required");
    }

    // Try to get authenticated user (optional for one-off payments)
    const authHeader = req.headers.get("Authorization");
    let userEmail;
    let userId;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data, error: userError } = await supabaseClient.auth.getUser(token);
      
      if (!userError && data.user) {
        userEmail = data.user.email;
        userId = data.user.id;
        logStep("User authenticated", { userId, email: userEmail });
      }
    }

    let finalPriceId = priceId;
    let metadata: Record<string, string> = {};

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // If product_id provided, look up from database
    if (product_id) {
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

      finalPriceId = product.stripe_price_id;
      metadata = {
        product_id: product_id,
        product_type: product.product_type,
        event_year: product.event_year.toString(),
        replay_id: product.replay_id || "",
      };
      
      if (userId) {
        metadata.user_id = userId;
      }
    } else {
      logStep("Using direct price ID", { priceId: finalPriceId });
    }


    // Check if a Stripe customer record exists for this user
    let customerId;
    
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing Stripe customer found", { customerId });
      } else {
        logStep("No existing Stripe customer found");
      }
    }

    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/launch-offer`,
      metadata,
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
