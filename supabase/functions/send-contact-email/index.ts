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

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, message }: ContactEmailRequest = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate input
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Save to database
    const { error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        phone,
        message
      });

    if (dbError) {
      console.error("Error saving to database:", dbError);
      // Continue with email sending even if database save fails
    }

    // Get email settings
    const { data: emailSettings } = await supabase
      .from('email_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['contact_primary_email', 'contact_cc_email']);

    const primaryEmail = emailSettings?.find(s => s.setting_key === 'contact_primary_email')?.setting_value || 'team@festivalof.ai';
    const ccEmail = emailSettings?.find(s => s.setting_key === 'contact_cc_email')?.setting_value || 'team@creatorcompany.co.uk';

    // Send email to admin
    const adminEmail = await resend.emails.send({
      from: "Festival of AI <onboarding@resend.dev>",
      to: [primaryEmail],
      cc: [ccEmail],
      subject: "Festival of AI Website Contact Form",
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    // Send confirmation to user
    const confirmationEmail = await resend.emails.send({
      from: "Festival of AI <onboarding@resend.dev>",
      to: [email],
      subject: "We received your message - Festival of AI",
      html: `
        <h1>Thank you for contacting us, ${name}!</h1>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
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
    console.error("Error in send-contact-email function:", error);
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
