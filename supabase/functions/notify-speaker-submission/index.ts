import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application_id } = await req.json();

    if (!application_id) {
      return new Response(JSON.stringify({ error: "application_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the full application
    const { data: app, error: fetchError } = await supabase
      .from("speaker_applications")
      .select("*")
      .eq("id", application_id)
      .single();

    if (fetchError || !app) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = [app.first_name, app.last_name].filter(Boolean).join(" ") || "Speaker";
    const trackLabel = app.preferred_track || "Not specified";

    // 1. Send confirmation email to applicant
    if (app.email) {
      await resend.emails.send({
        from: "Festival of AI <noreply@festivalof.ai>",
        to: [app.email],
        subject: "Application Received - Festival of AI 2026",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6366f1;">Festival of AI 2026</h1>
            <h2>Thank you, ${app.first_name || "there"}!</h2>
            <p>We've received your speaker application. Here's a summary of what you submitted:</p>
            <div style="margin: 20px 0; padding: 16px; background-color: #f8f9fa; border-radius: 8px;">
              <p><strong>Session Title:</strong> ${app.session_title || "Not provided"}</p>
              <p><strong>Preferred Track:</strong> ${trackLabel}</p>
              <p style="margin-bottom: 0;"><strong>Name:</strong> ${name}</p>
            </div>
            <h3>What happens next?</h3>
            <ul>
              <li>Our team will review your application</li>
              <li>You'll receive an update on your application status via email</li>
              <li>Shortlisted speakers will be contacted for further details</li>
            </ul>
            <p>Applications close on <strong>May 8th, 2026</strong>.</p>
            <p>If you have any questions, please reach out to us at <a href="mailto:team@festivalof.ai">team@festivalof.ai</a>.</p>
            <br>
            <p>Best regards,<br>The Festival of AI Team</p>
          </div>
        `,
      });
    }

    // 2. Send notification email to admin
    await resend.emails.send({
      from: "Festival of AI <noreply@festivalof.ai>",
      to: ["team@creatorcompany.co.uk"],
      subject: `New Speaker Application: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">New Speaker Application</h1>
          <div style="margin: 20px 0; padding: 16px; background-color: #f8f9fa; border-radius: 8px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${app.email || "Not provided"}</p>
            <p><strong>Phone:</strong> ${app.phone || "Not provided"}</p>
            <p><strong>Session Title:</strong> ${app.session_title || "Not provided"}</p>
            <p><strong>Preferred Track:</strong> ${trackLabel}</p>
            <p><strong>Bio:</strong> ${app.bio ? app.bio.substring(0, 200) + (app.bio.length > 200 ? "..." : "") : "Not provided"}</p>
            <p style="margin-bottom: 0;"><strong>Submitted:</strong> ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          ${app.session_description ? `
            <h3>Session Description</h3>
            <p>${app.session_description.substring(0, 500)}${app.session_description.length > 500 ? "..." : ""}</p>
          ` : ""}
          <p style="margin: 30px 0;">
            <a href="https://festivalof.ai/admin/speaker-applications" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Review in Admin Dashboard
            </a>
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in notify-speaker-submission:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
