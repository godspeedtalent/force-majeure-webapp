/**
 * Validate RSVP Edge Function
 *
 * Validates QR code scans for RSVPs at venue entrances. This function:
 * 1. Verifies QR code signature
 * 2. Checks RSVP status (confirmed/cancelled/already checked in)
 * 3. Updates RSVP with check-in timestamp
 * 4. Records scan event in audit log
 * 5. Returns RSVP details for display
 *
 * @endpoint POST /validate-rsvp
 * @requires authenticated user with SCAN_TICKETS permission
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { verifyRsvpQR } from '../_shared/qr.ts';
import { logActivity, getRequestContext, createRsvpScanLog } from '../_shared/activityLogger.ts';
import { verifyAuth, requirePermission } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface ValidateRsvpRequest {
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

interface ValidateRsvpResponse {
  valid: boolean;
  rsvp?: {
    id: string;
    event_id: string;
    attendee_name: string | null;
    attendee_email: string | null;
    event_name: string;
    event_start_time: string;
    venue_name: string;
    checked_in_at: string;
  };
  error?: string;
  reason?: 'invalid_qr' | 'already_scanned' | 'cancelled' | 'not_found' | 'permission_denied' | 'event_mismatch';
}

Deno.serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Use centralized auth verification
    const { user, supabase: authSupabase } = await verifyAuth(req);
    console.log('[validate-rsvp] Auth verified for user:', user.id);

    // Require scan_tickets permission (admin bypass is automatic)
    await requirePermission(authSupabase, user.id, 'scan_tickets');
    console.log('[validate-rsvp] Permission check passed for user:', user.id);

    // Get Supabase client for operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    // Parse request body
    const body: ValidateRsvpRequest = await req.json();
    const { qr_data, device_info, scan_location } = body;

    if (!qr_data) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Missing qr_data in request',
          reason: 'invalid_qr',
        } as ValidateRsvpResponse),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 1: Verify QR code signature
    const qrVerification = await verifyRsvpQR(qr_data);

    if (!qrVerification.valid) {
      // Log failed scan attempt
      await supabase.from('rsvp_scan_events').insert({
        rsvp_id: null,
        event_id: qrVerification.eventId || '00000000-0000-0000-0000-000000000000',
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
        } as ValidateRsvpResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { rsvpId, eventId } = qrVerification;

    // Step 2: Fetch RSVP from database with all related info
    const { data: rsvp, error: rsvpError } = await supabase
      .from('event_rsvps')
      .select(
        `
        id,
        event_id,
        user_id,
        status,
        checked_in_at,
        checked_in_by,
        events (
          id,
          title,
          start_time,
          venue_id,
          venues (
            name
          )
        ),
        profiles (
          display_name,
          full_name,
          email
        )
      `
      )
      .eq('id', rsvpId)
      .single();

    // Type the nested relations - Supabase returns arrays for joins
    const rsvpEventsArray = rsvp?.events as { id: string; title: string; start_time: string; venue_id: string; venues: { name: string }[] }[] | undefined;
    const rsvpEvent = rsvpEventsArray?.[0] ?? null;
    const rsvpVenue = rsvpEvent?.venues?.[0] ?? null;
    const rsvpProfilesArray = rsvp?.profiles as { display_name: string | null; full_name: string | null; email: string | null }[] | undefined;
    const rsvpProfile = rsvpProfilesArray?.[0] ?? null;

    if (rsvpError || !rsvp) {
      // Log failed scan attempt
      await supabase.from('rsvp_scan_events').insert({
        rsvp_id: rsvpId,
        event_id: eventId,
        scanned_by: user.id,
        scan_result: 'not_found',
        scan_location: scan_location || null,
        device_info: device_info || null,
      });

      return new Response(
        JSON.stringify({
          valid: false,
          error: 'RSVP not found',
          reason: 'not_found',
        } as ValidateRsvpResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: Verify event matches
    if (rsvp.event_id !== eventId) {
      await supabase.from('rsvp_scan_events').insert({
        rsvp_id: rsvpId,
        event_id: eventId,
        scanned_by: user.id,
        scan_result: 'event_mismatch',
        scan_location: scan_location || null,
        device_info: device_info || null,
      });

      return new Response(
        JSON.stringify({
          valid: false,
          error: 'RSVP event ID does not match QR code',
          reason: 'event_mismatch',
        } as ValidateRsvpResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 4: Check RSVP status
    if (rsvp.checked_in_at) {
      // Log duplicate scan attempt
      await supabase.from('rsvp_scan_events').insert({
        rsvp_id: rsvpId,
        event_id: eventId,
        scanned_by: user.id,
        scan_result: 'already_scanned',
        scan_location: scan_location || null,
        device_info: device_info || null,
      });

      const attendeeName = rsvpProfile?.display_name || rsvpProfile?.full_name || null;

      return new Response(
        JSON.stringify({
          valid: false,
          error: `RSVP already checked in at ${rsvp.checked_in_at}`,
          reason: 'already_scanned',
          rsvp: {
            id: rsvp.id,
            event_id: rsvp.event_id,
            attendee_name: attendeeName,
            attendee_email: rsvpProfile?.email || null,
            event_name: rsvpEvent?.title || 'Unknown Event',
            event_start_time: rsvpEvent?.start_time || '',
            venue_name: rsvpVenue?.name || 'Unknown Venue',
            checked_in_at: rsvp.checked_in_at || '',
          },
        } as ValidateRsvpResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (rsvp.status === 'cancelled') {
      // Log cancelled RSVP scan attempt
      await supabase.from('rsvp_scan_events').insert({
        rsvp_id: rsvpId,
        event_id: eventId,
        scanned_by: user.id,
        scan_result: 'cancelled',
        scan_location: scan_location || null,
        device_info: device_info || null,
      });

      return new Response(
        JSON.stringify({
          valid: false,
          error: 'RSVP has been cancelled',
          reason: 'cancelled',
        } as ValidateRsvpResponse),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 5: Valid RSVP! Update with check-in timestamp
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('event_rsvps')
      .update({
        checked_in_at: now,
        checked_in_by: user.email || user.id,
      })
      .eq('id', rsvpId);

    if (updateError) {
      console.error('Error updating RSVP check-in status:', updateError);
      // Don't fail the scan, just log the error
    }

    // Step 6: Log successful scan
    await supabase.from('rsvp_scan_events').insert({
      rsvp_id: rsvpId,
      event_id: eventId,
      scanned_by: user.id,
      scan_result: 'success',
      scan_location: scan_location || null,
      device_info: device_info || null,
    });

    const attendeeName = rsvpProfile?.display_name || rsvpProfile?.full_name || null;

    // Step 7: Log to activity logs
    try {
      const activityLogParams = createRsvpScanLog({
        rsvpId: rsvpId || '',
        eventId: eventId || '',
        eventName: rsvpEvent?.title || 'Unknown Event',
        scannerId: user.id,
        attendeeName: attendeeName,
        scanResult: 'success',
      });

      await logActivity(supabase, {
        ...activityLogParams,
        ...getRequestContext(req),
      });
    } catch (logError) {
      console.error('Error logging activity:', logError);
      // Don't fail the scan if logging fails
    }

    // Step 8: Return success with RSVP details
    return new Response(
      JSON.stringify({
        valid: true,
        rsvp: {
          id: rsvp.id,
          event_id: rsvp.event_id,
          attendee_name: attendeeName,
          attendee_email: rsvpProfile?.email || null,
          event_name: rsvpEvent?.title || 'Unknown Event',
          event_start_time: rsvpEvent?.start_time || '',
          venue_name: rsvpVenue?.name || 'Unknown Venue',
          checked_in_at: now,
        },
      } as ValidateRsvpResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[validate-rsvp] Error:', error);

    // Handle auth errors specifically
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('Unauthorized')) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: errorMessage,
          reason: 'permission_denied',
        } as ValidateRsvpResponse),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (errorMessage.includes('Forbidden')) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'User does not have permission to scan RSVPs',
          reason: 'permission_denied',
        } as ValidateRsvpResponse),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        valid: false,
        error: `Internal server error: ${errorMessage}`,
      } as ValidateRsvpResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
