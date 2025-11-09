import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { data: userRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!userRole || userRole.role !== "admin") {
      throw new Error("Admin access required");
    }

    const keyData = JSON.parse(serviceAccountKey);
    const accessToken = await getAccessToken(keyData);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const [overviewData, topPagesData, trafficData, deviceData] = await Promise.all([
      fetchGA4Report(accessToken, propertyId, thirtyDaysAgo, now, [
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "activeUsers" },
        { name: "conversions" }
      ], []),
      fetchGA4Report(accessToken, propertyId, thirtyDaysAgo, now, [
        { name: "screenPageViews" }
      ], [{ name: "pageTitle" }]),
      fetchGA4Report(accessToken, propertyId, thirtyDaysAgo, now, [
        { name: "activeUsers" }
      ], [{ name: "sessionSource" }]),
      fetchGA4Report(accessToken, propertyId, thirtyDaysAgo, now, [
        { name: "activeUsers" }
      ], [{ name: "deviceCategory" }])
    ]);

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
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: keyData.private_key_id,
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: keyData.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(keyData.private_key),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const jwt = `${unsignedToken}.${encodedSignature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await response.json();
  return data.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
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
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        }],
        metrics,
        dimensions,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`GA4 API error: ${response.statusText}`);
  }

  return await response.json();
}
