/**
 * Activity Logger Utility for Edge Functions
 *
 * Provides a consistent interface for logging activity events from Edge Functions.
 * Uses the log_activity database function to insert records.
 *
 * @module _shared/activityLogger
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

/**
 * Activity categories matching the database enum
 */
export type ActivityCategory =
  | 'account'
  | 'event'
  | 'artist'
  | 'venue'
  | 'recording'
  | 'ticket_tier'
  | 'ticket'
  | 'system'
  | 'contact';

/**
 * Activity event types matching the database enum
 */
export type ActivityEventType =
  // Account events
  | 'account_created'
  | 'role_assigned'
  | 'role_removed'
  | 'permission_changed'
  // Resource CUD events
  | 'resource_created'
  | 'resource_updated'
  | 'resource_deleted'
  // Ticket events
  | 'ticket_sold'
  | 'ticket_scanned'
  | 'ticket_refunded'
  | 'ticket_cancelled'
  // Contact events
  | 'contact_submission';

/**
 * Parameters for logging an activity event
 */
export interface LogActivityParams {
  /** The type of event (e.g., 'ticket_sold', 'resource_created') */
  eventType: ActivityEventType;
  /** The category of the activity (e.g., 'ticket', 'event') */
  category: ActivityCategory;
  /** Human-readable description of the activity */
  description: string;
  /** UUID of the user who performed the action (optional) */
  userId?: string;
  /** Type of resource affected (e.g., 'ticket', 'event', 'order') */
  targetResourceType?: string;
  /** UUID of the affected resource */
  targetResourceId?: string;
  /** Display name of the affected resource */
  targetResourceName?: string;
  /** Additional metadata (before/after values, details, etc.) */
  metadata?: Record<string, unknown>;
  /** IP address of the request origin */
  ipAddress?: string;
  /** User agent string from the request */
  userAgent?: string;
}

/**
 * Log an activity event to the database
 *
 * @param supabase - Supabase client (should use service role for inserts)
 * @param params - Activity log parameters
 * @returns The UUID of the created log entry, or null on failure
 *
 * @example
 * ```ts
 * await logActivity(supabase, {
 *   eventType: 'ticket_sold',
 *   category: 'ticket',
 *   description: '2 tickets sold for Event Name',
 *   userId: order.user_id,
 *   targetResourceType: 'order',
 *   targetResourceId: orderId,
 *   targetResourceName: `Order #${orderId.slice(0, 8)}`,
 *   metadata: { event_id: eventId, total_cents: totalCents },
 *   ...getRequestContext(req),
 * });
 * ```
 */
export async function logActivity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  params: LogActivityParams
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('log_activity', {
      p_event_type: params.eventType,
      p_category: params.category,
      p_description: params.description,
      p_user_id: params.userId || null,
      p_target_resource_type: params.targetResourceType || null,
      p_target_resource_id: params.targetResourceId || null,
      p_target_resource_name: params.targetResourceName || null,
      p_metadata: params.metadata || {},
      p_ip_address: params.ipAddress || null,
      p_user_agent: params.userAgent || null,
    });

    if (error) {
      console.error('[ActivityLogger] Failed to log activity:', error);
      return null;
    }

    return data as string;
  } catch (err) {
    console.error(
      '[ActivityLogger] Error logging activity:',
      err instanceof Error ? err.message : 'Unknown error'
    );
    return null;
  }
}

/**
 * Extract request context (IP address and user agent) from a Request object
 *
 * @param req - The incoming HTTP Request
 * @returns Object with ipAddress and userAgent fields
 *
 * @example
 * ```ts
 * const context = getRequestContext(req);
 * await logActivity(supabase, {
 *   eventType: 'ticket_scanned',
 *   category: 'ticket',
 *   description: 'Ticket scanned',
 *   ...context,
 * });
 * ```
 */
export function getRequestContext(req: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  // Try various headers for IP address (in order of preference)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');

  let ipAddress: string | undefined;
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    ipAddress = forwardedFor.split(',')[0]?.trim();
  } else if (realIp) {
    ipAddress = realIp;
  } else if (cfConnectingIp) {
    ipAddress = cfConnectingIp;
  }

  const userAgent = req.headers.get('user-agent') || undefined;

  return { ipAddress, userAgent };
}

/**
 * Helper to create a ticket sale activity log
 */
export function createTicketSaleLog(params: {
  orderId: string;
  eventId: string;
  eventName: string;
  userId?: string;
  ticketCount: number;
  totalCents: number;
  tierDetails?: Array<{ name: string; quantity: number; price_cents: number }>;
}): Omit<LogActivityParams, 'ipAddress' | 'userAgent'> {
  return {
    eventType: 'ticket_sold',
    category: 'ticket',
    description: `${params.ticketCount} ticket${params.ticketCount !== 1 ? 's' : ''} sold for ${params.eventName}`,
    userId: params.userId,
    targetResourceType: 'order',
    targetResourceId: params.orderId,
    targetResourceName: `Order #${params.orderId.slice(0, 8)}`,
    metadata: {
      event_id: params.eventId,
      event_name: params.eventName,
      ticket_count: params.ticketCount,
      total_cents: params.totalCents,
      tier_details: params.tierDetails,
    },
  };
}

/**
 * Helper to create a ticket scan activity log
 */
export function createTicketScanLog(params: {
  ticketId: string;
  eventId: string;
  eventName: string;
  tierName: string;
  attendeeName?: string | null;
  scannerId?: string;
  scanResult: 'success' | 'already_used' | 'invalid' | 'cancelled' | 'refunded';
}): Omit<LogActivityParams, 'ipAddress' | 'userAgent'> {
  const isSuccess = params.scanResult === 'success';

  return {
    eventType: 'ticket_scanned',
    category: 'ticket',
    description: isSuccess
      ? `Ticket scanned for ${params.eventName}${params.attendeeName ? ` (${params.attendeeName})` : ''}`
      : `Ticket scan failed: ${params.scanResult} - ${params.eventName}`,
    userId: params.scannerId,
    targetResourceType: 'ticket',
    targetResourceId: params.ticketId,
    targetResourceName: params.tierName,
    metadata: {
      event_id: params.eventId,
      event_name: params.eventName,
      tier_name: params.tierName,
      attendee_name: params.attendeeName,
      scan_result: params.scanResult,
      scanned_at: new Date().toISOString(),
    },
  };
}

/**
 * Helper to create a contact form submission activity log
 */
export function createContactSubmissionLog(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Omit<LogActivityParams, 'ipAddress' | 'userAgent'> {
  return {
    eventType: 'contact_submission',
    category: 'contact',
    description: `Contact form submission from ${params.name} (${params.email}): ${params.subject}`,
    targetResourceType: 'contact_form',
    targetResourceName: params.subject || 'No subject',
    metadata: {
      name: params.name,
      email: params.email,
      subject: params.subject,
      message: params.message,
      submitted_at: new Date().toISOString(),
    },
  };
}

/**
 * Helper to create an RSVP scan activity log
 */
export function createRsvpScanLog(params: {
  rsvpId: string;
  eventId: string;
  eventName: string;
  attendeeName?: string | null;
  scannerId?: string;
  scanResult: 'success' | 'already_scanned' | 'invalid' | 'cancelled' | 'not_found' | 'event_mismatch';
}): Omit<LogActivityParams, 'ipAddress' | 'userAgent'> {
  const isSuccess = params.scanResult === 'success';

  return {
    eventType: 'ticket_scanned', // Reuse ticket_scanned event type for RSVPs
    category: 'ticket',
    description: isSuccess
      ? `RSVP scanned for ${params.eventName}${params.attendeeName ? ` (${params.attendeeName})` : ''}`
      : `RSVP scan failed: ${params.scanResult} - ${params.eventName}`,
    userId: params.scannerId,
    targetResourceType: 'rsvp',
    targetResourceId: params.rsvpId,
    targetResourceName: params.eventName,
    metadata: {
      event_id: params.eventId,
      event_name: params.eventName,
      attendee_name: params.attendeeName,
      scan_result: params.scanResult,
      scanned_at: new Date().toISOString(),
    },
  };
}
