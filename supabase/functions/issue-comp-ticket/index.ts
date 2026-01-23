/**
 * Issue Comp Ticket Edge Function
 *
 * Creates a complimentary ticket invitation for an event.
 * Admin-only function that creates a comp_ticket record and optionally sends
 * an email invitation to the recipient.
 *
 * @endpoint POST /issue-comp-ticket
 * @param {string} eventId - Event ID
 * @param {string} ticketTierId - Ticket tier ID
 * @param {string} recipientEmail - Email address of recipient
 * @param {string} [expiresAt] - Optional expiration date
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { verifyAuth, requireAnyRole } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface IssueCompTicketRequest {
  eventId: string;
  ticketTierId: string;
  recipientEmail: string;
  expiresAt?: string;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mailchimpApiKey = Deno.env.get('MAILCHIMP_TRANSACTIONAL_API_KEY');

    // SECURITY: Use centralized auth verification
    const { user, supabase: authSupabase } = await verifyAuth(req);
    console.log('[issue-comp-ticket] Auth verified for user:', user.id);

    // Require admin or developer role (admin bypass is automatic)
    await requireAnyRole(authSupabase, user.id, ['admin', 'developer']);
    console.log('[issue-comp-ticket] Role check passed for user:', user.id);

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Parse request
    const { eventId, ticketTierId, recipientEmail, expiresAt }: IssueCompTicketRequest =
      await req.json();

    if (!eventId || !ticketTierId || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Issuing comp ticket:', { eventId, ticketTierId, recipientEmail, issuedBy: user.id });

    // Validate event exists
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, title')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate ticket tier exists and belongs to event
    const { data: tier, error: tierError } = await supabaseAdmin
      .from('ticket_tiers')
      .select('id, name, event_id')
      .eq('id', ticketTierId)
      .eq('event_id', eventId)
      .single();

    if (tierError || !tier) {
      return new Response(
        JSON.stringify({ error: 'Ticket tier not found or does not belong to event' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if recipient already has a pending comp ticket for this event
    const { data: existingComp } = await supabaseAdmin
      .from('comp_tickets')
      .select('id')
      .eq('event_id', eventId)
      .eq('recipient_email', recipientEmail.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existingComp) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Recipient already has a pending comp ticket for this event',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if recipient is an existing user
    const { data: recipientUser } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', recipientEmail.toLowerCase())
      .single();

    // Create comp ticket record
    const compTicketData = {
      event_id: eventId,
      ticket_tier_id: ticketTierId,
      recipient_email: recipientEmail.toLowerCase(),
      recipient_user_id: recipientUser?.id || null,
      issued_by_user_id: user.id,
      status: 'pending',
      expires_at: expiresAt || null,
    };

    const { data: compTicket, error: createError } = await supabaseAdmin
      .from('comp_tickets')
      .insert(compTicketData)
      .select()
      .single();

    if (createError) {
      console.error('Failed to create comp ticket:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create comp ticket', details: createError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Comp ticket created:', compTicket.id);

    // Send email invitation if Mailchimp is configured
    if (mailchimpApiKey) {
      try {
        const claimUrl = `${req.headers.get('origin') || 'https://forcemajeure.com'}/claim/${compTicket.claim_token}`;
        const isExistingUser = !!recipientUser;

        const emailHTML = generateCompTicketEmailHTML({
          eventTitle: event.title,
          tierName: tier.name,
          claimUrl,
          isExistingUser,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        });

        const subject = isExistingUser
          ? `You've received a complimentary ticket to ${event.title}`
          : `You're invited to ${event.title}`;

        await fetch('https://mandrillapp.com/api/1.0/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: mailchimpApiKey,
            message: {
              html: emailHTML,
              subject,
              from_email: 'tickets@forcemajeure.com',
              from_name: 'Force Majeure',
              to: [
                {
                  email: recipientEmail,
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

        console.log('Comp ticket email sent to:', recipientEmail);
      } catch (emailError) {
        // Don't fail if email fails - comp ticket was created successfully
        console.error('Failed to send comp ticket email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        compTicket: {
          id: compTicket.id,
          claim_token: compTicket.claim_token,
          recipient_email: compTicket.recipient_email,
          status: compTicket.status,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[issue-comp-ticket] Error:', error);

    // Handle auth errors specifically
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (errorMessage.includes('Forbidden')) {
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to issue comp ticket',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Generate HTML email for comp ticket invitation
 */
function generateCompTicketEmailHTML(data: {
  eventTitle: string;
  tierName: string;
  claimUrl: string;
  isExistingUser: boolean;
  expiresAt: Date | null;
}): string {
  const expiresText = data.expiresAt
    ? `This invitation expires on ${data.expiresAt.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}.`
    : '';

  const ctaText = data.isExistingUser
    ? 'CLAIM YOUR TICKET'
    : 'SIGN UP & CLAIM YOUR TICKET';

  const instructionText = data.isExistingUser
    ? 'Click the button below to claim your complimentary ticket. You\'ll be able to view it in your account immediately.'
    : 'Click the button below to create your Force Majeure account and claim your complimentary ticket.';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited - ${data.eventTitle}</title>
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
              <h2 style="margin: 0 0 20px 0; color: #dfba7d; font-size: 24px;">You're invited.</h2>

              <p style="margin: 0 0 30px 0; color: #ffffff; line-height: 1.6;">
                You've received a complimentary ticket to <strong style="color: #dfba7d;">${data.eventTitle}</strong>.
              </p>

              <!-- Ticket Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px; background-color: #0a0a0a; border: 1px solid #333;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #dfba7d; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Ticket</p>
                    <p style="margin: 0 0 5px 0; color: #ffffff; font-size: 18px; font-weight: bold;">${data.eventTitle}</p>
                    <p style="margin: 0; color: #cccccc;">${data.tierName}</p>
                    <p style="margin: 15px 0 0 0; padding-top: 15px; border-top: 1px solid #333; color: #dfba7d; font-size: 14px;">
                      ✦ COMPLIMENTARY TICKET ✦
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 30px 0; color: #cccccc; line-height: 1.6;">
                ${instructionText}
              </p>

              ${expiresText ? `<p style="margin: 0 0 30px 0; color: #ff9999; font-size: 14px;">${expiresText}</p>` : ''}

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${data.claimUrl}" style="display: inline-block; padding: 15px 40px; background-color: #dfba7d; color: #000000; text-decoration: none; font-weight: bold; letter-spacing: 1px;">${ctaText}</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #666666; font-size: 12px; text-align: center;">
                If the button doesn't work, copy and paste this link:<br>
                <a href="${data.claimUrl}" style="color: #dfba7d;">${data.claimUrl}</a>
              </p>
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
