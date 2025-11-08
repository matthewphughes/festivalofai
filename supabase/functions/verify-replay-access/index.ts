import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-REPLAY-ACCESS] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("No auth header - user not logged in");
      return new Response(JSON.stringify({ has_access: false, is_admin: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("Auth error", { error: userError?.message });
      return new Response(JSON.stringify({ has_access: false, is_admin: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!roleData;
    logStep("Admin check", { isAdmin });

    if (isAdmin) {
      return new Response(JSON.stringify({ has_access: true, is_admin: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Parse request body to get replay_id and/or event_year
    const { replay_id, event_year } = await req.json();
    logStep("Checking access", { replay_id, event_year });

    if (!replay_id && !event_year) {
      return new Response(JSON.stringify({ has_access: false, is_admin: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if user has purchased:
    // 1. This specific replay (individual purchase)
    // 2. The year bundle (null replay_id for that year)
    
    const conditions = [];
    
    // Check for individual replay purchase
    if (replay_id) {
      const { data: individualPurchase } = await supabaseClient
        .from("replay_purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("replay_id", replay_id)
        .maybeSingle();
      
      if (individualPurchase) {
        logStep("Individual replay access granted");
        return new Response(JSON.stringify({ has_access: true, is_admin: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }
    
    // Check for year bundle purchase
    if (event_year) {
      const { data: bundlePurchase } = await supabaseClient
        .from("replay_purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("event_year", event_year)
        .is("replay_id", null)
        .maybeSingle();

      if (bundlePurchase) {
        logStep("Bundle access granted");
        return new Response(JSON.stringify({ has_access: true, is_admin: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    logStep("No access found");
    return new Response(JSON.stringify({ has_access: false, is_admin: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, has_access: false, is_admin: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
