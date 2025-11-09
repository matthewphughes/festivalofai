import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GA4Response {
  pageViews: number;
  sessions: number;
  activeUsers: number;
  conversions: number;
  topPages: Array<{ page: string; views: number }>;
  trafficSources: Array<{ source: string; users: number }>;
  deviceCategories: Array<{ device: string; users: number }>;
}

interface RealtimeResponse {
  activeUsers: number;
  usersByPage: Array<{ page: string; users: number }>;
  usersByCountry: Array<{ country: string; users: number }>;
  recentEvents: Array<{ eventName: string; timestamp: string }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    const propertyId = Deno.env.get("GA4_PROPERTY_ID");

    if (!serviceAccountKey || !propertyId) {
      throw new Error("Missing Google Analytics credentials");
    }

    const authToken = req.headers.get("Authorization");
    if (!authToken) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authToken } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.error("Auth error:", userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!user) {
      console.error("No user found in session");
      throw new Error("Unauthorized: No user in session");
    }

    console.log("User authenticated:", user.id);

    // Check admin role
    const { data: userRole, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    console.log("Role query result:", { userRole, roleError });

    if (roleError) {
      console.error("Role check error:", roleError);
      throw new Error(`Role check failed: ${roleError.message}`);
    }

    if (!userRole) {
      console.error("User is not an admin:", user.id);
      throw new Error("Admin access required");
    }

    console.log("Admin access verified for user:", user.id);

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "analytics";
    const daysBack = parseInt(url.searchParams.get("daysBack") || "30");
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    console.log("Fetching GA4 data with params:", { mode, daysBack, startDateParam, endDateParam });

    const keyData = JSON.parse(serviceAccountKey);
    const accessToken = await getAccessToken(keyData);

    if (mode === "realtime") {
      const realtimeData = await fetchRealtimeData(accessToken, propertyId);
      return new Response(JSON.stringify(realtimeData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate date range
    let startDate: Date;
    let endDate: Date;

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else {
      const now = new Date();
      endDate = now;
      startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    }

    console.log("Date range:", startDate.toISOString(), "to", endDate.toISOString());

    const [overviewData, topPagesData, trafficData, deviceData] = await Promise.all([
      fetchGA4Report(accessToken, propertyId, startDate, endDate, [
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "activeUsers" },
        { name: "conversions" }
      ], []),
      fetchGA4Report(accessToken, propertyId, startDate, endDate, [
        { name: "screenPageViews" }
      ], [{ name: "pageTitle" }]),
      fetchGA4Report(accessToken, propertyId, startDate, endDate, [
        { name: "activeUsers" }
      ], [{ name: "sessionSource" }]),
      fetchGA4Report(accessToken, propertyId, startDate, endDate, [
        { name: "activeUsers" }
      ], [{ name: "deviceCategory" }])
    ]);

    console.log("Overview data rows:", overviewData.rows?.length || 0);
    console.log("Top pages data rows:", topPagesData.rows?.length || 0);

    const response: GA4Response = {
      pageViews: parseInt(overviewData.rows?.[0]?.metricValues?.[0]?.value || "0"),
      sessions: parseInt(overviewData.rows?.[0]?.metricValues?.[1]?.value || "0"),
      activeUsers: parseInt(overviewData.rows?.[0]?.metricValues?.[2]?.value || "0"),
      conversions: parseInt(overviewData.rows?.[0]?.metricValues?.[3]?.value || "0"),
      topPages: (topPagesData.rows || []).slice(0, 10).map((row: any) => ({
        page: row.dimensionValues[0].value,
        views: parseInt(row.metricValues[0].value)
      })),
      trafficSources: (trafficData.rows || []).slice(0, 10).map((row: any) => ({
        source: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value)
      })),
      deviceCategories: (deviceData.rows || []).map((row: any) => ({
        device: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value)
      }))
    };

    console.log("Returning response:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching GA4 data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getAccessToken(keyData: any): Promise<string> {
  console.log("Getting access token for:", keyData.client_email);

  const privateKeyPem = keyData.private_key;
  const privateKeyDer = pemToDer(privateKeyPem);
  
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const header = {
    alg: "RS256" as const,
    typ: "JWT",
  };

  const payload = {
    iss: keyData.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: getNumericDate(60 * 60),
    iat: getNumericDate(0),
  };

  const jwt = await create(header, payload, privateKey);

  console.log("JWT created, requesting access token");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OAuth error:", errorText);
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const data = await response.json();
  console.log("Access token obtained successfully");
  return data.access_token;
}

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function fetchGA4Report(
  accessToken: string,
  propertyId: string,
  startDate: Date,
  endDate: Date,
  metrics: Array<{ name: string }>,
  dimensions: Array<{ name: string }>
): Promise<any> {
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];
  
  console.log(`Fetching report from ${startDateStr} to ${endDateStr}`);

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{
          startDate: startDateStr,
          endDate: endDateStr,
        }],
        metrics,
        dimensions,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`GA4 API error: ${response.statusText}`, errorText);
    throw new Error(`GA4 API error: ${response.statusText}`);
  }

  return await response.json();
}

async function fetchRealtimeData(
  accessToken: string,
  propertyId: string
): Promise<RealtimeResponse> {
  console.log("Fetching realtime data");

  const [activeUsersData, pageViewsData, eventsData] = await Promise.all([
    fetchRealtimeReport(accessToken, propertyId, [{ name: "activeUsers" }], []),
    fetchRealtimeReport(accessToken, propertyId, [{ name: "activeUsers" }], [{ name: "unifiedScreenName" }]),
    fetchRealtimeReport(accessToken, propertyId, [{ name: "eventCount" }], [{ name: "eventName" }])
  ]);

  return {
    activeUsers: parseInt(activeUsersData.rows?.[0]?.metricValues?.[0]?.value || "0"),
    usersByPage: (pageViewsData.rows || []).slice(0, 10).map((row: any) => ({
      page: row.dimensionValues[0].value,
      users: parseInt(row.metricValues[0].value)
    })),
    usersByCountry: [],
    recentEvents: (eventsData.rows || []).slice(0, 10).map((row: any) => ({
      eventName: row.dimensionValues[0].value,
      timestamp: new Date().toISOString()
    }))
  };
}

async function fetchRealtimeReport(
  accessToken: string,
  propertyId: string,
  metrics: Array<{ name: string }>,
  dimensions: Array<{ name: string }>
): Promise<any> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        metrics,
        dimensions,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`GA4 Realtime API error: ${response.statusText}`, errorText);
    throw new Error(`GA4 Realtime API error: ${response.statusText}`);
  }

  return await response.json();
}
