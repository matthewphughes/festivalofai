import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DiscountEmailRequest {
  campaignId: string;
  name: string;
  email: string;
  phone: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId, name, email, phone }: DiscountEmailRequest = await req.json();

    console.log("Processing discount email request:", { campaignId, name, email, phone });

    // Validate input
    if (!campaignId || !name || !email || !phone) {
      throw new Error("Missing required fields: campaignId, name, email, or phone");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("discount_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError) {
      console.error("Error fetching campaign:", campaignError);
      throw new Error("Campaign not found");
    }

    console.log("Campaign found:", campaign.campaign_name);

    // Replace placeholders in email content
    const emailContent = campaign.email_content
      .replace(/\{name\}/g, name)
      .replace(/\{discount_code\}/g, campaign.discount_code)
      .replace(/\{discount_percentage\}/g, campaign.discount_percentage?.toString() || "")
      .replace(/\{discount_amount\}/g, campaign.discount_amount ? `£${(campaign.discount_amount / 100).toFixed(2)}` : "");

    // Send email to customer via Resend API
    const customerEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Festival of AI <team@festivalof.ai>",
        to: [email],
        subject: campaign.email_subject,
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: white;
                padding: 30px;
                border: 1px solid #e0e0e0;
                border-top: none;
                border-radius: 0 0 10px 10px;
              }
              .discount-code {
                background: #f7fafc;
                border: 2px dashed #667eea;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
                border-radius: 8px;
              }
              .code {
                font-size: 28px;
                font-weight: bold;
                color: #667eea;
                letter-spacing: 2px;
              }
              .cta-button {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: 600;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                color: #666;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Your Exclusive Discount!</h1>
            </div>
            <div class="content">
              ${emailContent}
              <div class="discount-code">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your discount code:</p>
                <div class="code">${campaign.discount_code}</div>
              </div>
              <p style="text-align: center;">
                <a href="https://festivalof.ai/tickets" class="cta-button">Get Your Tickets Now</a>
              </p>
            </div>
            <div class="footer">
              <p>This offer expires soon. Don't miss out!</p>
              <p>Festival of AI - Where Innovation Meets Intelligence</p>
            </div>
          </body>
        </html>
      `,
      }),
    });

    if (!customerEmailResponse.ok) {
      const errorData = await customerEmailResponse.json();
      console.error("Resend API error (customer):", errorData);
      throw new Error(`Failed to send customer email: ${JSON.stringify(errorData)}`);
    }

    const customerEmailData = await customerEmailResponse.json();
    console.log("Customer email sent successfully:", customerEmailData);

    // Send notification email to team
    const teamEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Festival of AI <team@festivalof.ai>",
        to: ["team@creatorcompany.co.uk"],
        subject: `New Discount Code Request - ${campaign.campaign_name}`,
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: #1a1a1a;
                color: white;
                padding: 20px;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background: white;
                padding: 30px;
                border: 1px solid #e0e0e0;
                border-top: none;
                border-radius: 0 0 8px 8px;
              }
              .detail-row {
                padding: 12px 0;
                border-bottom: 1px solid #f0f0f0;
              }
              .label {
                font-weight: 600;
                color: #666;
                display: inline-block;
                width: 120px;
              }
              .value {
                color: #333;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>New Discount Code Request</h2>
            </div>
            <div class="content">
              <p>Someone has requested a discount code for the ${campaign.campaign_name} campaign.</p>
              
              <div style="margin-top: 20px;">
                <div class="detail-row">
                  <span class="label">Name:</span>
                  <span class="value">${name}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Email:</span>
                  <span class="value">${email}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Phone:</span>
                  <span class="value">${phone}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Campaign:</span>
                  <span class="value">${campaign.campaign_name}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Discount Code:</span>
                  <span class="value"><strong>${campaign.discount_code}</strong></span>
                </div>
              </div>
              
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                The discount code has been automatically sent to the customer's email address.
              </p>
            </div>
          </body>
        </html>
      `,
      }),
    });

    if (!teamEmailResponse.ok) {
      const teamErrorData = await teamEmailResponse.json();
      console.error("Resend API error (team notification):", teamErrorData);
      // Don't throw here - customer email was sent successfully
    } else {
      const teamEmailData = await teamEmailResponse.json();
      console.log("Team notification email sent successfully:", teamEmailData);
    }

    // Update claim record to mark email as sent
    const { error: updateError } = await supabase
      .from("discount_claims")
      .update({ email_sent: true })
      .eq("campaign_id", campaignId)
      .eq("email", email);

    if (updateError) {
      console.error("Error updating claim record:", updateError);
    }

    return new Response(JSON.stringify({ success: true, data: customerEmailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-discount-email function:", error);
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
