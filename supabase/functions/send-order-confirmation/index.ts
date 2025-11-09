import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  payment_intent_id: string;
  customer_email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[ORDER-CONFIRMATION] Function started");

    const { payment_intent_id, customer_email }: OrderConfirmationRequest = await req.json();

    if (!payment_intent_id || !customer_email) {
      throw new Error("Missing required parameters");
    }

    console.log("[ORDER-CONFIRMATION] Processing for:", customer_email);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch purchase details from replay_purchases table
    const { data: purchases, error: purchasesError } = await supabaseClient
      .from("replay_purchases")
      .select(`
        *,
        stripe_products (
          product_name,
          product_type,
          amount,
          currency
        )
      `)
      .eq("stripe_payment_intent", payment_intent_id);

    if (purchasesError) {
      console.error("[ORDER-CONFIRMATION] Error fetching purchases:", purchasesError);
      throw purchasesError;
    }

    if (!purchases || purchases.length === 0) {
      console.log("[ORDER-CONFIRMATION] No purchases found for payment intent:", payment_intent_id);
      throw new Error("No purchases found for this payment intent");
    }

    console.log("[ORDER-CONFIRMATION] Found", purchases.length, "purchase(s)");

    // Calculate total
    const subtotal = purchases.reduce((sum, p) => sum + p.stripe_products.amount, 0);
    const discount = purchases.reduce((sum, p) => sum + (p.discount_amount || 0), 0);
    const total = subtotal - discount;

    // Format currency
    const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(amount / 100);
    };

    const currency = purchases[0].stripe_products.currency;

    // Generate purchase items HTML
    const itemsHtml = purchases.map(purchase => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${purchase.stripe_products.product_name}</strong>
          <br/>
          <span style="color: #6b7280; font-size: 14px;">
            ${purchase.stripe_products.product_type === "year_bundle" 
              ? `All ${purchase.event_year} Replays` 
              : `${purchase.event_year} Event`}
          </span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${formatCurrency(purchase.stripe_products.amount, currency)}
        </td>
      </tr>
    `).join("");

    // Send confirmation email
    const emailResponse = await resend.emails.send({
      from: "Festival of AI <tickets@festivalofai.com>",
      to: [customer_email],
      subject: "Order Confirmation - Festival of AI",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Your Purchase!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your order has been confirmed</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="margin-top: 0;">Hi there,</p>
            
            <p>Your purchase has been successfully processed. Below are the details of your order:</p>
            
            <h2 style="color: #667eea; margin-top: 30px; margin-bottom: 15px; font-size: 20px;">Order Details</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                ${discount > 0 ? `
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                      <strong>Subtotal</strong>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
                      ${formatCurrency(subtotal, currency)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #059669;">
                      <strong>Discount</strong>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #059669;">
                      -${formatCurrency(discount, currency)}
                    </td>
                  </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px; font-size: 18px;">
                    <strong>Total</strong>
                  </td>
                  <td style="padding: 12px; text-align: right; font-size: 18px;">
                    <strong>${formatCurrency(total, currency)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <p style="margin-bottom: 10px;"><strong>Payment ID:</strong> ${payment_intent_id}</p>
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 30px 0;">
              <p style="margin: 0; color: #1e40af;">
                <strong>📧 Access Your Content</strong><br/>
                You can access your purchased replays and tickets anytime by visiting your account dashboard.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${Deno.env.get("SITE_URL") || "https://festivalofai.com"}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                View My Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">
              Questions about your order? Contact us at 
              <a href="mailto:tickets@festivalofai.com" style="color: #667eea; text-decoration: none;">tickets@festivalofai.com</a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              <strong>The Festival of AI Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Festival of AI. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("[ORDER-CONFIRMATION] Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResponse.data?.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("[ORDER-CONFIRMATION] Error:", error);
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
