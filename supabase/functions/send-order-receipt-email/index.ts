/**
 * Send Order Receipt Email Edge Function
 *
 * Orchestrates the complete email delivery process:
 * 1. Fetches order data with all relations
 * 2. Generates PDF tickets
 * 3. Generates HTML email
 * 4. Sends via Mailchimp Transactional Email API
 *
 * @endpoint POST /send-order-receipt-email
 * @param {string} order_id - The order ID to send receipt for
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  order_id: string;
}

Deno.serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mailchimpApiKey = Deno.env.get('MAILCHIMP_TRANSACTIONAL_API_KEY');

    if (!mailchimpApiKey) {
      console.error('MAILCHIMP_TRANSACTIONAL_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const { order_id }: SendEmailRequest = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'Missing order_id in request' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Fetching order data for email:', order_id);

    // Fetch complete order data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        id,
        user_id,
        event_id,
        total_cents,
        subtotal_cents,
        fees_cents,
        currency,
        created_at,
        profiles!orders_user_id_profiles_fkey (
          email,
          full_name
        ),
        events (
          id,
          title,
          start_time,
          venues (
            name,
            address
          )
        ),
        order_items (
          id,
          quantity,
          unit_price_cents,
          unit_fee_cents,
          subtotal_cents,
          fees_cents,
          total_cents,
          ticket_tiers (
            name
          )
        ),
        tickets (
          id,
          qr_code_data,
          attendee_name,
          attendee_email,
          ticket_tiers (
            name
          )
        )
      `
      )
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found', details: orderError }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get recipient email - profiles returns as array from join, get first element
    const profilesArray = order.profiles as { email: string; full_name: string }[] | null;
    const profile = profilesArray?.[0] ?? null;
    const recipientEmail = profile?.email;
    const recipientName = profile?.full_name || 'Valued Customer';

    if (!recipientEmail) {
      console.error('No email address found for order:', order_id);
      return new Response(
        JSON.stringify({ error: 'No email address for order' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Generating email content for:', recipientEmail);

    // events returns as array from join, get first element
    const eventsArray = order.events as { id: string; title: string; start_time: string; venues: { name: string; address: string }[] }[] | null;
    const event = eventsArray?.[0] ?? null;
    const venue = event?.venues?.[0] ?? null;

    // Generate HTML email content
    const emailHTML = generateEmailHTML({
      orderId: order.id,
      orderDate: order.created_at,
      purchaserName: recipientName,
      eventTitle: event?.title || 'Event',
      eventDate: event?.start_time || new Date().toISOString(),
      venueName: venue?.name || 'Venue',
      items: order.order_items.map((item: any) => ({
        name: item.ticket_tiers?.name || 'Ticket',
        quantity: item.quantity,
        price: item.unit_price_cents / 100,
      })),
      subtotal: order.subtotal_cents / 100,
      fees: order.fees_cents / 100,
      total: order.total_cents / 100,
      ticketCount: order.tickets.length,
    });

    // Note: For MVP, we're skipping PDF generation in the edge function
    // PDF generation requires canvas/image libraries that are complex in Deno
    // The email will include a link to view tickets online instead

    console.log('Sending email via Mailchimp Transactional...');

    // Send email via Mailchimp Transactional API (Mandrill)
    const mailchimpResponse = await fetch(
      'https://mandrillapp.com/api/1.0/messages/send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: mailchimpApiKey,
          message: {
            html: emailHTML,
            subject: `Your tickets for ${event?.title || 'your event'}`,
            from_email: 'tickets@forcemajeure.com',
            from_name: 'Force Majeure',
            to: [
              {
                email: recipientEmail,
                name: recipientName,
                type: 'to',
              },
            ],
            track_opens: true,
            track_clicks: true,
            auto_text: true,
            inline_css: true,
          },
        }),
      }
    );

    if (!mailchimpResponse.ok) {
      const errorText = await mailchimpResponse.text();
      console.error('Mailchimp API error:', errorText);
      throw new Error(`Mailchimp API error: ${errorText}`);
    }

    const result = await mailchimpResponse.json();
    console.log('Email sent successfully:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Generate HTML email content
 * Simplified version for MVP - full template would be more comprehensive
 */
function generateEmailHTML(data: {
  orderId: string;
  orderDate: string;
  purchaserName: string;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  fees: number;
  total: number;
  ticketCount: number;
}): string {
  const eventDate = new Date(data.eventDate);
  const formattedEventDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedEventTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Tickets - ${data.eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #000000; color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border: 1px solid #dfba7d;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 20px; background-color: #000000;">
              <h1 style="margin: 0; color: #dfba7d; font-size: 32px; letter-spacing: 2px;">FORCE MAJEURE</h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 12px; letter-spacing: 1px;">ELECTRONIC MUSIC EVENTS</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #dfba7d; font-size: 24px;">Your tickets are ready.</h2>

              <p style="margin: 0 0 20px 0; color: #ffffff; line-height: 1.6;">
                Hi ${data.purchaserName},
              </p>

              <p style="margin: 0 0 30px 0; color: #ffffff; line-height: 1.6;">
                Thank you for your purchase! Your tickets for <strong style="color: #dfba7d;">${data.eventTitle}</strong> are confirmed.
              </p>

              <!-- Event Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; background-color: #0a0a0a; border: 1px solid #333;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #dfba7d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Event Details</p>
                    <p style="margin: 0 0 5px 0; color: #ffffff; font-size: 18px; font-weight: bold;">${data.eventTitle}</p>
                    <p style="margin: 0 0 5px 0; color: #cccccc;">${formattedEventDate}</p>
                    <p style="margin: 0 0 5px 0; color: #cccccc;">${formattedEventTime}</p>
                    <p style="margin: 0; color: #cccccc;">${data.venueName}</p>
                  </td>
                </tr>
              </table>

              <!-- Order Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 15px 0; color: #dfba7d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Summary</p>
                  </td>
                </tr>
                ${data.items
                  .map(
                    item => `
                <tr>
                  <td style="padding: 10px 0; border-top: 1px solid #333;">
                    <table width="100%">
                      <tr>
                        <td style="color: #ffffff;">${item.name} (×${item.quantity})</td>
                        <td align="right" style="color: #ffffff;">$${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `
                  )
                  .join('')}
                <tr>
                  <td style="padding: 10px 0; border-top: 1px solid #333;">
                    <table width="100%">
                      <tr>
                        <td style="color: #cccccc;">Subtotal</td>
                        <td align="right" style="color: #cccccc;">$${data.subtotal.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <table width="100%">
                      <tr>
                        <td style="color: #cccccc;">Fees</td>
                        <td align="right" style="color: #cccccc;">$${data.fees.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 0; border-top: 2px solid #dfba7d;">
                    <table width="100%">
                      <tr>
                        <td style="color: #dfba7d; font-weight: bold; font-size: 18px;">Total</td>
                        <td align="right" style="color: #dfba7d; font-weight: bold; font-size: 18px;">$${data.total.toFixed(2)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="https://forcemajeure.com/orders/${data.orderId}" style="display: inline-block; padding: 15px 40px; background-color: transparent; color: #dfba7d; text-decoration: none; border: 2px solid #dfba7d; font-weight: bold; letter-spacing: 1px;">VIEW MY TICKETS</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px 0; color: #cccccc; font-size: 14px; line-height: 1.6;">
                You have ${data.ticketCount} ticket${data.ticketCount !== 1 ? 's' : ''} for this event. You can view and download your tickets anytime from your account.
              </p>

              <p style="margin: 0; color: #cccccc; font-size: 14px; line-height: 1.6;">
                Order ID: ${data.orderId}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #0a0a0a; border-top: 1px solid #333;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px; text-align: center;">
                Need help? Contact us at support@forcemajeure.com
              </p>
              <p style="margin: 0; color: #666666; font-size: 11px; text-align: center;">
                © ${new Date().getFullYear()} Force Majeure. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
