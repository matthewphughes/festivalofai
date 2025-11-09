import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PURCHASE] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Authentication failed");
    }

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    const { session_id } = await req.json();
    if (!session_id) {
      throw new Error("session_id is required");
    }

    logStep("Verifying session", { session_id });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Session retrieved", { 
      status: session.payment_status, 
      metadata: session.metadata 
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if this is a replay purchase
    const productId = session.metadata?.product_id;
    const productType = session.metadata?.product_type;
    const eventYear = session.metadata?.event_year;
    const replayId = session.metadata?.replay_id;

    logStep("Metadata extracted", { productId, productType, eventYear, replayId });

    if (productType === "replay") {
      logStep("Processing replay purchase", { eventYear, replayId });

      // For individual replay purchase
      if (replayId) {
        // Check if purchase already recorded
        const { data: existingPurchase } = await supabaseClient
          .from("replay_purchases")
          .select("id")
          .eq("user_id", userId)
          .eq("replay_id", replayId)
          .maybeSingle();

        if (existingPurchase) {
          logStep("Individual replay purchase already recorded");
          return new Response(JSON.stringify({ 
            success: true, 
            already_recorded: true 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Record the individual replay purchase
        const { error: insertError } = await supabaseClient
          .from("replay_purchases")
          .insert({
            user_id: userId,
            event_year: parseInt(eventYear),
            replay_id: replayId,
            stripe_payment_intent: session.payment_intent as string,
            product_id: productId || null,
          });

        if (insertError) {
          logStep("Error recording individual replay purchase", { error: insertError.message });
          throw new Error("Failed to record purchase");
        }

        logStep("Individual replay purchase recorded successfully");

        return new Response(JSON.stringify({ 
          success: true,
          replay_id: replayId
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // For year bundle purchase
      if (eventYear) {
        // Check if purchase already recorded
        const { data: existingPurchase } = await supabaseClient
          .from("replay_purchases")
          .select("id")
          .eq("user_id", userId)
          .eq("event_year", parseInt(eventYear))
          .is("replay_id", null)
          .maybeSingle();

        if (existingPurchase) {
          logStep("Year bundle purchase already recorded");
          return new Response(JSON.stringify({ 
            success: true, 
            already_recorded: true 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Record the year bundle purchase
        const { error: insertError } = await supabaseClient
          .from("replay_purchases")
          .insert({
            user_id: userId,
            event_year: parseInt(eventYear),
            stripe_payment_intent: session.payment_intent as string,
            product_id: productId || null,
          });

        if (insertError) {
          logStep("Error recording year bundle purchase", { error: insertError.message });
          throw new Error("Failed to record purchase");
        }

        logStep("Year bundle purchase recorded successfully");

        return new Response(JSON.stringify({ 
          success: true,
          event_year: parseInt(eventYear)
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Not a replay purchase, just confirm payment success
    return new Response(JSON.stringify({ 
      success: true,
      product_type: productType || "ticket"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
