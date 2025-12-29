/**
 * Validate Ticket Edge Function
 *
 * Validates QR code scans at venue entrances. This function:
 * 1. Verifies QR code signature
 * 2. Checks ticket status (valid/used/refunded/cancelled)
 * 3. Updates ticket to 'used' status
 * 4. Records scan event in audit log
 * 5. Returns ticket details for display
 *
 * @endpoint POST /validate-ticket
 * @requires authenticated user with SCAN_TICKETS permission
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { verifyTicketQR } from '../_shared/qr.ts';
import { logActivity, getRequestContext, createTicketScanLog } from '../_shared/activityLogger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface ValidateTicketRequest {
  qr_data: string;
  scanner_user_id?: string;
  device_info?: {
    userAgent?: string;
    platform?: string;
    browser?: string;
  };
  scan_location?: {
    latitude?: number;
    longitude?: number;
    name?: string;
  };
}

interface ValidateTicketResponse {
  valid: boolean;
  ticket?: {
    id: string;
    event_id: string;
    ticket_tier_name: string;
    attendee_name: string | null;
    attendee_email: string | null;
    event_name: string;
    event_start_time: string;
    venue_name: string;
    checked_in_at: string;
  };
  error?: string;
  reason?: 'invalid_qr' | 'already_used' | 'refunded' | 'cancelled' | 'not_found' | 'permission_denied' | 'event_mismatch';
}

Deno.serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Missing authorization header',
          reason: 'permission_denied',
        } as ValidateTicketResponse),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Unauthorized',
          reason: 'permission_denied',
        } as ValidateTicketResponse),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check scan permission
    const { data: permissions } = await supabase
      .from('user_permissions')
      .select('permission')
      .eq('user_id', user.id)
      .eq('permission', 'scan_tickets')
      .single();

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'developer']);

    if (!permissions && (!roles || roles.length === 0)) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'User does not have permission to scan tickets',
          reason: 'permission_denied',
        } as ValidateTicketResponse),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: ValidateTicketRequest = await req.json();
    const { qr_data, device_info, scan_location } = body;

    if (!qr_data) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Missing qr_data in request',
          reason: 'invalid_qr',
        } as ValidateTicketResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 1: Verify QR code signature
    const qrVerification = await verifyTicketQR(qr_data);

    if (!qrVerification.valid) {
      // Log failed scan attempt
      await supabase.from('ticket_scan_events').insert({
        ticket_id: null,
        event_id: null,
        scanned_by: user.id,
        scan_result: 'invalid',
        scan_location: scan_location || null,
        device_info: device_info || null,
      });

      return new Response(
        JSON.stringify({
          valid: false,
          error: qrVerification.error || 'Invalid QR code',
          reason: 'invalid_qr',
        } as ValidateTicketResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { ticketId, eventId } = qrVerification;

    // Step 2: Fetch ticket from database with all related info
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(
        `
        id,
        event_id,
        status,
        attendee_name,
        attendee_email,
        checked_in_at,
        checked_in_by,
        ticket_tier_id,
        ticket_tiers (
          name
        ),
        events (
          id,
          title,
          start_time,
          venue_id,
          venues (
            name
          )
        )
      `
      )
      .eq('id', ticketId)
      .single();

    // Type the nested relations as single objects (not arrays)
    const ticketTier = ticket?.ticket_tiers as { name: string } | null;
    const ticketEvent = ticket?.events as { id: string; title: string; start_time: string; venue_id: string; venues: { name: string } | null } | null;

    if (ticketError || !ticket) {
      // Log failed scan attempt
      await supabase.from('ticket_scan_events').insert({
        ticket_id: ticketId,
        event_id: eventId,
        scanned_by: user.id,
        scan_result: 'invalid',
        scan_location: scan_location || null,
        device_info: device_info || null,
      });

      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Ticket not found',
          reason: 'not_found',
        } as ValidateTicketResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: Verify event matches
    if (ticket.event_id !== eventId) {
      await supabase.from('ticket_scan_events').insert({
        ticket_id: ticketId,
        event_id: eventId,
        scanned_by: user.id,
        scan_result: 'invalid',
        scan_location: scan_location || null,
        device_info: device_info || null,
      });

      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Ticket event ID does not match QR code',
          reason: 'event_mismatch',
        } as ValidateTicketResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 4: Check ticket status
    if (ticket.status === 'used') {
      // Log duplicate scan attempt
      await supabase.from('ticket_scan_events').insert({
        ticket_id: ticketId,
        event_id: eventId,
        scanned_by: user.id,
        scan_result: 'already_used',
        scan_location: scan_location || null,
        device_info: device_info || null,
      });

      return new Response(
        JSON.stringify({
          valid: false,
          error: `Ticket already used. Checked in at ${ticket.checked_in_at}`,
          reason: 'already_used',
          ticket: {
            id: ticket.id,
            event_id: ticket.event_id,
            ticket_tier_name: ticketTier?.name || 'Unknown',
            attendee_name: ticket.attendee_name,
            attendee_email: ticket.attendee_email,
            event_name: ticketEvent?.title || 'Unknown Event',
            event_start_time: ticketEvent?.start_time || '',
            venue_name: ticketEvent?.venues?.name || 'Unknown Venue',
            checked_in_at: ticket.checked_in_at || '',
          },
        } as ValidateTicketResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (ticket.status === 'refunded') {
      // Log refunded ticket scan attempt
      await supabase.from('ticket_scan_events').insert({
        ticket_id: ticketId,
        event_id: eventId,
        scanned_by: user.id,
        scan_result: 'refunded',
        scan_location: scan_location || null,
        device_info: device_info || null,
      });

      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Ticket has been refunded',
          reason: 'refunded',
        } as ValidateTicketResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (ticket.status === 'cancelled') {
      // Log cancelled ticket scan attempt
      await supabase.from('ticket_scan_events').insert({
        ticket_id: ticketId,
        event_id: eventId,
        scanned_by: user.id,
        scan_result: 'cancelled',
        scan_location: scan_location || null,
        device_info: device_info || null,
      });

      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Ticket has been cancelled',
          reason: 'cancelled',
        } as ValidateTicketResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 5: Valid ticket! Update to 'used' status
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'used',
        checked_in_at: now,
        checked_in_by: user.email || user.id,
      })
      .eq('id', ticketId);

    if (updateError) {
      console.error('Error updating ticket status:', updateError);
      // Don't fail the scan, just log the error
    }

    // Step 6: Log successful scan
    await supabase.from('ticket_scan_events').insert({
      ticket_id: ticketId,
      event_id: eventId,
      scanned_by: user.id,
      scan_result: 'success',
      scan_location: scan_location || null,
      device_info: device_info || null,
    });

    // Step 7: Log to activity logs
    try {
      const activityLogParams = createTicketScanLog({
        ticketId: ticketId || '',
        eventId: eventId || '',
        eventName: ticketEvent?.title || 'Unknown Event',
        scannerId: user.id,
        scannerEmail: user.email || undefined,
        ticketTierName: ticketTier?.name || 'Unknown',
        attendeeName: ticket.attendee_name || undefined,
      });

      await logActivity(supabase, {
        ...activityLogParams,
        ...getRequestContext(req),
      });
    } catch (logError) {
      console.error('Error logging activity:', logError);
      // Don't fail the scan if logging fails
    }

    // Step 8: Return success with ticket details
    return new Response(
      JSON.stringify({
        valid: true,
        ticket: {
          id: ticket.id,
          event_id: ticket.event_id,
          ticket_tier_name: ticketTier?.name || 'Unknown',
          attendee_name: ticket.attendee_name,
          attendee_email: ticket.attendee_email,
          event_name: ticketEvent?.title || 'Unknown Event',
          event_start_time: ticketEvent?.start_time || '',
          venue_name: ticketEvent?.venues?.name || 'Unknown Venue',
          checked_in_at: now,
        },
      } as ValidateTicketResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({
        valid: false,
        error: `Internal server error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      } as ValidateTicketResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
