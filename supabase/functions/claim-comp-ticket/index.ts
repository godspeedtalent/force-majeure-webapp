/**
 * Claim Comp Ticket Edge Function
 *
 * Claims a complimentary ticket, creating a $0 order and the actual ticket.
 * User must be authenticated. The comp ticket must be in 'pending' status.
 *
 * @endpoint POST /claim-comp-ticket
 * @param {string} claimToken - The claim token from the comp ticket
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { generateTicketQR } from '../_shared/qr.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface ClaimCompTicketRequest {
  claimToken: string;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mailchimpApiKey = Deno.env.get('MAILCHIMP_TRANSACTIONAL_API_KEY');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create client with user context
    const supabaseWithAuth = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseWithAuth.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const { claimToken }: ClaimCompTicketRequest = await req.json();

    if (!claimToken) {
      return new Response(
        JSON.stringify({ error: 'Missing claim token' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Claiming comp ticket:', { claimToken, userId: user.id });

    // Fetch comp ticket by claim token
    const { data: compTicket, error: compError } = await supabaseAdmin
      .from('comp_tickets')
      .select(`
        *,
        events(id, title),
        ticket_tiers(id, name, price_cents)
      `)
      .eq('claim_token', claimToken)
      .single();

    if (compError || !compTicket) {
      console.error('Comp ticket not found:', compError);
      return new Response(
        JSON.stringify({ error: 'Comp ticket not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check status
    if (compTicket.status !== 'pending') {
      const statusMessages: Record<string, string> = {
        claimed: 'This comp ticket has already been claimed',
        expired: 'This comp ticket has expired',
        revoked: 'This comp ticket has been revoked',
      };
      return new Response(
        JSON.stringify({
          success: false,
          error: statusMessages[compTicket.status] || 'Invalid comp ticket status',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check expiration
    if (compTicket.expires_at && new Date(compTicket.expires_at) < new Date()) {
      // Update status to expired
      await supabaseAdmin
        .from('comp_tickets')
        .update({ status: 'expired' })
        .eq('id', compTicket.id);

      return new Response(
        JSON.stringify({ success: false, error: 'This comp ticket has expired' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const event = compTicket.events;
    const tier = compTicket.ticket_tiers;

    if (!event || !tier) {
      return new Response(
        JSON.stringify({ error: 'Event or ticket tier not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create $0 order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        event_id: compTicket.event_id,
        subtotal_cents: 0,
        fees_cents: 0,
        total_cents: 0,
        status: 'completed',
        currency: 'usd',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Created $0 order:', order.id);

    // Create order item
    const { data: orderItem, error: orderItemError } = await supabaseAdmin
      .from('order_items')
      .insert({
        order_id: order.id,
        item_type: 'ticket',
        ticket_tier_id: compTicket.ticket_tier_id,
        quantity: 1,
        unit_price_cents: 0,
        unit_fee_cents: 0,
        subtotal_cents: 0,
        fees_cents: 0,
        total_cents: 0,
      })
      .select()
      .single();

    if (orderItemError) {
      console.error('Failed to create order item:', orderItemError);
      // Cleanup order
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create order item' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create ticket with QR code
    const ticketId = crypto.randomUUID();
    const qrCodeData = await generateTicketQR(ticketId, compTicket.event_id);

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        id: ticketId,
        order_id: order.id,
        order_item_id: orderItem.id,
        event_id: compTicket.event_id,
        ticket_tier_id: compTicket.ticket_tier_id,
        qr_code_data: qrCodeData,
        status: 'valid',
        has_protection: false,
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Failed to create ticket:', ticketError);
      // Cleanup
      await supabaseAdmin.from('order_items').delete().eq('id', orderItem.id);
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create ticket' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Created ticket:', ticket.id);

    // Update comp ticket status
    const { error: updateError } = await supabaseAdmin
      .from('comp_tickets')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: user.id,
        ticket_id: ticket.id,
        order_id: order.id,
      })
      .eq('id', compTicket.id);

    if (updateError) {
      console.error('Failed to update comp ticket status:', updateError);
      // Don't fail - ticket was created successfully
    }

    // Grant exclusive content access
    await supabaseAdmin.from('exclusive_content_grants').insert({
      user_id: user.id,
      event_id: compTicket.event_id,
      order_id: order.id,
      content_type: 'event_access',
      content_url: `/events/${compTicket.event_id}/content`,
    });

    // Send confirmation email
    if (mailchimpApiKey && user.email) {
      try {
        const emailHTML = generateClaimConfirmationEmailHTML({
          eventTitle: event.title,
          tierName: tier.name,
          ticketUrl: `${req.headers.get('origin') || 'https://forcemajeure.com'}/orders`,
        });

        await fetch('https://mandrillapp.com/api/1.0/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: mailchimpApiKey,
            message: {
              html: emailHTML,
              subject: `Your ticket for ${event.title} is ready`,
              from_email: 'tickets@forcemajeure.com',
              from_name: 'Force Majeure',
              to: [
                {
                  email: user.email,
                  type: 'to',
                },
              ],
              track_opens: true,
              track_clicks: true,
              auto_text: true,
              inline_css: true,
            },
          }),
        });

        console.log('Claim confirmation email sent to:', user.email);
      } catch (emailError) {
        console.error('Failed to send claim confirmation email:', emailError);
        // Don't fail - ticket was claimed successfully
      }
    }

    console.log('Comp ticket claimed successfully:', compTicket.id);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        ticketId: ticket.id,
        message: 'Comp ticket claimed successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error claiming comp ticket:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to claim comp ticket',
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
 * Generate HTML email for claim confirmation
 */
function generateClaimConfirmationEmailHTML(data: {
  eventTitle: string;
  tierName: string;
  ticketUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Ticket is Ready - ${data.eventTitle}</title>
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
              <h2 style="margin: 0 0 20px 0; color: #dfba7d; font-size: 24px;">Your ticket is ready.</h2>

              <p style="margin: 0 0 30px 0; color: #ffffff; line-height: 1.6;">
                You've successfully claimed your complimentary ticket to <strong style="color: #dfba7d;">${data.eventTitle}</strong>.
              </p>

              <!-- Ticket Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; background-color: #0a0a0a; border: 1px solid #333;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #dfba7d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Ticket</p>
                    <p style="margin: 0 0 5px 0; color: #ffffff; font-size: 18px; font-weight: bold;">${data.eventTitle}</p>
                    <p style="margin: 0; color: #cccccc;">${data.tierName}</p>
                    <p style="margin: 15px 0 0 0; padding-top: 15px; border-top: 1px solid #333; color: #22c55e; font-size: 14px;">
                      ✓ TICKET CLAIMED
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px 0; color: #cccccc; line-height: 1.6;">
                Your ticket is now available in your account. You can view and download it anytime.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${data.ticketUrl}" style="display: inline-block; padding: 15px 40px; background-color: transparent; color: #dfba7d; text-decoration: none; border: 2px solid #dfba7d; font-weight: bold; letter-spacing: 1px;">VIEW MY TICKET</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #0a0a0a; border-top: 1px solid #333;">
              <p style="margin: 0 0 10px 0; color: #999999; font-size: 12px; text-align: center;">
                Questions? Contact us at support@forcemajeure.com
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
