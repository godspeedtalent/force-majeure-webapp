/**
 * Wallet Feature Types
 *
 * Types for the user wallet feature - displaying tickets,
 * upcoming shows, and QR codes for venue entry.
 */

/**
 * Ticket status - matches database constraint
 */
export type TicketStatus = 'valid' | 'used' | 'refunded' | 'cancelled';

/**
 * Venue information for ticket display
 */
export interface TicketVenue {
  id: string;
  name: string;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
}

/**
 * Event information for ticket display
 */
export interface TicketEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  hero_image: string | null;
  venue: TicketVenue | null;
}

/**
 * Ticket tier information
 */
export interface TicketTierInfo {
  id: string;
  name: string;
  description: string | null;
}

/**
 * Order information for ticket display
 */
export interface TicketOrder {
  id: string;
  created_at: string;
  user_id: string | null;
}

/**
 * Base ticket from database
 */
export interface Ticket {
  id: string;
  order_id: string;
  order_item_id: string;
  ticket_tier_id: string;
  event_id: string;
  qr_code_data: string;
  attendee_name: string | null;
  attendee_email: string | null;
  status: TicketStatus;
  checked_in_at: string | null;
  checked_in_by: string | null;
  has_protection: boolean;
  apple_wallet_url: string | null;
  google_wallet_url: string | null;
  test_data: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Ticket with all related details for display
 */
export interface TicketWithDetails extends Ticket {
  ticket_tier: TicketTierInfo;
  event: TicketEvent;
  order: TicketOrder;
}

/**
 * Ticket grouped by event for wallet display
 */
export interface TicketsByEvent {
  event: TicketEvent;
  tickets: TicketWithDetails[];
  orderDate: string;
}

/**
 * QR code data structure (matches server-side generation)
 */
export interface TicketQRData {
  t: string; // ticket_id
  e: string; // event_id
  v: number; // version
  s: string; // HMAC signature (first 16 chars)
}

/**
 * Parse QR code data from string
 */
export function parseQRCodeData(qrCodeData: string): TicketQRData | null {
  try {
    return JSON.parse(qrCodeData) as TicketQRData;
  } catch {
    return null;
  }
}

/**
 * Check if a ticket is for an upcoming event
 */
export function isUpcomingTicket(ticket: TicketWithDetails): boolean {
  const eventStart = new Date(ticket.event.start_time);
  const now = new Date();
  return eventStart > now && ticket.status === 'valid';
}

/**
 * Check if a ticket is for a past event
 */
export function isPastTicket(ticket: TicketWithDetails): boolean {
  const eventStart = new Date(ticket.event.start_time);
  const now = new Date();
  return eventStart <= now || ticket.status === 'used';
}

/**
 * Sort tickets by event date (ascending for upcoming, descending for past)
 */
export function sortTicketsByEventDate(
  tickets: TicketWithDetails[],
  ascending = true
): TicketWithDetails[] {
  return [...tickets].sort((a, b) => {
    const dateA = new Date(a.event.start_time).getTime();
    const dateB = new Date(b.event.start_time).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Group tickets by event
 */
export function groupTicketsByEvent(tickets: TicketWithDetails[]): TicketsByEvent[] {
  const grouped = new Map<string, TicketsByEvent>();

  for (const ticket of tickets) {
    const eventId = ticket.event.id;
    if (!grouped.has(eventId)) {
      grouped.set(eventId, {
        event: ticket.event,
        tickets: [],
        orderDate: ticket.order.created_at,
      });
    }
    grouped.get(eventId)!.tickets.push(ticket);
  }

  return Array.from(grouped.values());
}

// ============================================
// RSVP Types
// ============================================

/**
 * RSVP status - matches database constraint
 */
export type RsvpStatus = 'confirmed' | 'cancelled' | 'waitlisted';

/**
 * Event information for RSVP display (extends ticket event)
 */
export interface RsvpEvent extends TicketEvent {
  is_free_event: boolean;
  rsvp_capacity: number | null;
}

/**
 * RSVP with all related details for display
 */
export interface RsvpWithDetails {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  created_at: string;
  updated_at: string;
  event: RsvpEvent;
}

/**
 * RSVPs grouped by event for wallet display
 */
export interface RsvpsByEvent {
  event: RsvpEvent;
  rsvps: RsvpWithDetails[];
  rsvpDate: string;
}

/**
 * Check if an RSVP is for an upcoming event
 */
export function isUpcomingRsvp(rsvp: RsvpWithDetails): boolean {
  const eventStart = new Date(rsvp.event.start_time);
  const now = new Date();
  return eventStart > now && rsvp.status === 'confirmed';
}

/**
 * Check if an RSVP is for a past event
 */
export function isPastRsvp(rsvp: RsvpWithDetails): boolean {
  const eventStart = new Date(rsvp.event.start_time);
  const now = new Date();
  return eventStart <= now || rsvp.status === 'cancelled';
}

/**
 * Sort RSVPs by event date
 */
export function sortRsvpsByEventDate(
  rsvps: RsvpWithDetails[],
  ascending = true
): RsvpWithDetails[] {
  return [...rsvps].sort((a, b) => {
    const dateA = new Date(a.event.start_time).getTime();
    const dateB = new Date(b.event.start_time).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Group RSVPs by event
 */
export function groupRsvpsByEvent(rsvps: RsvpWithDetails[]): RsvpsByEvent[] {
  const grouped = new Map<string, RsvpsByEvent>();

  for (const rsvp of rsvps) {
    const eventId = rsvp.event.id;
    if (!grouped.has(eventId)) {
      grouped.set(eventId, {
        event: rsvp.event,
        rsvps: [],
        rsvpDate: rsvp.created_at,
      });
    }
    grouped.get(eventId)!.rsvps.push(rsvp);
  }

  return Array.from(grouped.values());
}
