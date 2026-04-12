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

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  reviewed: "Under Review",
  shortlist: "Shortlisted",
  accepted: "Accepted",
  rejected: "Not Selected",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, firstName, sessionId, applicationLink, customMessage, emailType, newStatus } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "email is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = firstName || "there";
    const link = applicationLink || `https://festivalof.ai/call-for-speakers?resume=${sessionId}`;

    let subject: string;
    let bodyHtml: string;

    if (emailType === "status" && newStatus) {
      subject = `Speaker Application Update - Festival of AI 2026`;
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">Festival of AI 2026</h1>
          <h2>Hi ${name}!</h2>
          <p>Your speaker application status has been updated to: <strong>${statusLabels[newStatus] || newStatus}</strong></p>
          ${customMessage ? `<div style="margin: 20px 0; padding: 16px; background-color: #f8f9fa; border-left: 4px solid #6366f1; border-radius: 4px;">${customMessage}</div>` : ""}
          ${newStatus === "accepted" ? `<p style="margin: 20px 0;">🎉 Congratulations! We're thrilled to have you as a speaker. We'll be in touch shortly with next steps.</p>` : ""}
          ${["draft", "submitted", "reviewed"].includes(newStatus) ? `
            <p style="margin: 30px 0;">
              <a href="${link}" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                View Your Application
              </a>
            </p>
          ` : ""}
          <br>
          <p>Best regards,<br>The Festival of AI Team</p>
        </div>
      `;
    } else {
      subject = "Complete Your Speaker Application - Festival of AI 2026";
      bodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">Festival of AI 2026</h1>
          <h2>Hi ${name}!</h2>
          <p>We noticed you started a speaker application but haven't submitted it yet. We'd love to hear from you!</p>
          ${customMessage ? `<div style="margin: 20px 0; padding: 16px; background-color: #f8f9fa; border-left: 4px solid #6366f1; border-radius: 4px;">${customMessage}</div>` : ""}
          <p>Applications close on <strong>May 8th, 2026</strong> — don't miss your chance to speak at one of the UK's most exciting AI events.</p>
          <p style="margin: 30px 0;">
            <a href="${link}" style="background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Continue Your Application
            </a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6366f1;">${link}</p>
          <br>
          <p>Best regards,<br>The Festival of AI Team</p>
        </div>
      `;
    }

    const emailResult = await resend.emails.send({
      from: "Festival of AI <noreply@festivalof.ai>",
      to: [email],
      subject,
      html: bodyHtml,
    });

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending speaker email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
