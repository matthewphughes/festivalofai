import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SponsorRequestData {
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_name, contact_name, email, phone, message }: SponsorRequestData = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate required fields
    if (!company_name || !contact_name || !email) {
      return new Response(
        JSON.stringify({ error: "Company name, contact name, and email are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Save to database
    const { error: dbError } = await supabase
      .from('sponsor_requests')
      .insert({
        company_name,
        contact_name,
        email,
        phone,
        message
      });

    if (dbError) {
      console.error("Error saving to database:", dbError);
      // Continue with email sending even if database save fails
    }

    // Send email to admin
    const adminEmail = await resend.emails.send({
      from: "Festival of AI <onboarding@resend.dev>",
      to: ["hello@festivalof.ai"],
      subject: `Sponsor Pack Request: ${company_name}`,
      html: `
        <h2>New Sponsor Pack Request</h2>
        <p><strong>Company:</strong> ${company_name}</p>
        <p><strong>Contact Name:</strong> ${contact_name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        ${message ? `
          <p><strong>Additional Information:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        ` : ''}
      `,
    });

    // Send confirmation to requester
    const confirmationEmail = await resend.emails.send({
      from: "Festival of AI <onboarding@resend.dev>",
      to: [email],
      subject: "Thank you for your interest in sponsoring Festival of AI",
      html: `
        <h1>Thank you for your interest, ${contact_name}!</h1>
        <p>We've received your sponsor pack request for <strong>${company_name}</strong>.</p>
        <p>Our team will review your request and send you our comprehensive sponsor pack within 24 hours.</p>
        <p>In the meantime, if you have any questions, please don't hesitate to reach out to us at hello@festivalof.ai</p>
        <br>
        <p>Best regards,<br>The Festival of AI Team</p>
      `,
    });

    return new Response(
      JSON.stringify({ success: true, adminEmail, confirmationEmail }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-sponsor-request function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
