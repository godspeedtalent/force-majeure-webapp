import type { Order } from '@/features/orders/services/orderService';

/**
 * Event Data Repository Types
 *
 * Defines the common interface for fetching event-related data.
 * Used by both production and test repository implementations.
 */

/**
 * Profile data shape - normalized from both profiles and test_profiles tables
 */
export interface ProfileData {
  id: string;
  display_name: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  /** Whether the user has opted into being visible on guest lists */
  guest_list_visible?: boolean | null;
}

/**
 * Attendee data as returned from repositories
 * Contains userId and optional profile data
 */
export interface AttendeeData {
  userId: string;
  profile: ProfileData | null;
}

/**
 * Guest data shape - for anonymous ticket holders
 */
export interface GuestData {
  id: string;
  full_name: string | null;
  email: string | null;
}

/**
 * Guest attendee data - anonymous ticket holders without user accounts
 */
export interface GuestAttendeeData {
  guestId: string;
  guest: GuestData | null;
}

/**
 * Consolidated attendee result from get_event_attendees RPC
 * Returns all attendee types in a single call to avoid N+1 queries
 */
export interface ConsolidatedAttendeesResult {
  ticket_holders: AttendeeData[];
  rsvp_holders: AttendeeData[];
  interested_users: AttendeeData[];
  guest_holders: GuestAttendeeData[];
}

/**
 * Event Data Repository Interface
 *
 * Defines all data access operations for event-related data.
 * Implementations exist for production tables and test_* tables.
 * The factory selects the appropriate implementation based on event status.
 */
export interface IEventDataRepository {
  /**
   * Fetch all orders for an event
   */
  getOrdersByEventId(eventId: string): Promise<Order[]>;

  /**
   * Get count of confirmed RSVPs for an event
   */
  getRsvpCount(eventId: string): Promise<number>;

  /**
   * Get list of RSVP holders with profile data
   */
  getRsvpHolders(eventId: string): Promise<AttendeeData[]>;

  /**
   * Get count of users interested in an event
   */
  getInterestCount(eventId: string): Promise<number>;

  /**
   * Get list of interested users with profile data
   */
  getInterestedUsers(eventId: string): Promise<AttendeeData[]>;

  /**
   * Get list of ticket holders (from completed orders) with profile data
   */
  getTicketHolders(eventId: string): Promise<AttendeeData[]>;

  /**
   * Get list of guest ticket holders (anonymous, no user account)
   */
  getGuestTicketHolders(eventId: string): Promise<GuestAttendeeData[]>;

  /**
   * Get all attendees in a single call (ticket holders, RSVPs, interested, guests)
   * This is more efficient than calling individual methods - reduces 4+ queries to 1
   */
  getAllAttendees(eventId: string): Promise<ConsolidatedAttendeesResult>;
}
