import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY") || "";
    
    console.log("[GET-STRIPE-KEY] Retrieving publishable key", {
      keyExists: !!publishableKey,
      keyPrefix: publishableKey.substring(0, 7),
    });

    return new Response(
      JSON.stringify({ publishableKey }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[GET-STRIPE-KEY] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage, publishableKey: "" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
