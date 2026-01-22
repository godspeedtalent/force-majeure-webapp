/**
 * Wallet RSVP Service
 *
 * Centralized service for fetching RSVP data for the wallet feature.
 * Follows the pattern established by ticketService.ts.
 */

import { supabase, logger } from '@/shared';
import type { RsvpWithDetails } from '../types';

/**
 * Base select query for RSVPs with all related data
 */
const RSVP_SELECT_QUERY = `
  *,
  event:events!event_rsvps_event_id_fkey(
    id,
    title,
    start_time,
    end_time,
    hero_image,
    is_free_event,
    rsvp_capacity,
    venue:venues(
      id,
      name,
      address_line_1,
      city,
      state
    )
  )
`;

export const walletRsvpService = {
  /**
   * Fetch upcoming RSVPs for a user (events in the future with confirmed status)
   */
  async getUpcomingRsvps(userId: string): Promise<RsvpWithDetails[]> {
    const now = new Date();

    // Note: PostgREST doesn't support ordering by embedded resource fields,
    // so we fetch without order and sort in JavaScript
    const { data, error } = await supabase
      .from('event_rsvps')
      .select(RSVP_SELECT_QUERY)
      .eq('user_id', userId)
      .eq('status', 'confirmed');

    if (error) {
      logger.error('Error fetching upcoming RSVPs', {
        error: error.message,
        source: 'walletRsvpService.getUpcomingRsvps',
        userId,
      });
      throw error;
    }

    // Filter to only RSVPs for future events
    const filteredData = (data || []).filter(
      rsvp =>
        rsvp.event &&
        rsvp.event.start_time &&
        new Date(rsvp.event.start_time) >= now
    );

    // Sort by event start time ascending (soonest first)
    filteredData.sort((a, b) => {
      const timeA = a.event?.start_time ? new Date(a.event.start_time).getTime() : 0;
      const timeB = b.event?.start_time ? new Date(b.event.start_time).getTime() : 0;
      return timeA - timeB;
    });

    return filteredData as unknown as RsvpWithDetails[];
  },

  /**
   * Fetch past RSVPs for a user (events in the past)
   */
  async getPastRsvps(userId: string): Promise<RsvpWithDetails[]> {
    const now = new Date();

    const { data, error } = await supabase
      .from('event_rsvps')
      .select(RSVP_SELECT_QUERY)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error fetching past RSVPs', {
        error: error.message,
        source: 'walletRsvpService.getPastRsvps',
        userId,
      });
      throw error;
    }

    // Filter to only RSVPs for past events (regardless of status)
    const filteredData = (data || []).filter(
      rsvp =>
        rsvp.event &&
        rsvp.event.start_time &&
        new Date(rsvp.event.start_time) < now
    );

    // Sort by event start time descending (most recent first)
    filteredData.sort((a, b) => {
      const timeA = a.event?.start_time ? new Date(a.event.start_time).getTime() : 0;
      const timeB = b.event?.start_time ? new Date(b.event.start_time).getTime() : 0;
      return timeB - timeA;
    });

    return filteredData as unknown as RsvpWithDetails[];
  },

  /**
   * Fetch all RSVPs for a user
   */
  async getRsvpsByUserId(userId: string): Promise<RsvpWithDetails[]> {
    const { data, error } = await supabase
      .from('event_rsvps')
      .select(RSVP_SELECT_QUERY)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching RSVPs by user', {
        error: error.message,
        source: 'walletRsvpService.getRsvpsByUserId',
        userId,
      });
      throw error;
    }

    return (data || []) as unknown as RsvpWithDetails[];
  },

  /**
   * Fetch a single RSVP by ID with full details
   */
  async getRsvpById(rsvpId: string): Promise<RsvpWithDetails | null> {
    const { data, error } = await supabase
      .from('event_rsvps')
      .select(RSVP_SELECT_QUERY)
      .eq('id', rsvpId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Error fetching RSVP by ID', {
        error: error.message,
        source: 'walletRsvpService.getRsvpById',
        rsvpId,
      });
      throw error;
    }

    return data as unknown as RsvpWithDetails;
  },

  /**
   * Get RSVP count for a user
   */
  async getRsvpCountByUserId(userId: string): Promise<{
    upcoming: number;
    past: number;
    total: number;
  }> {
    const now = new Date();

    const { data, error } = await supabase
      .from('event_rsvps')
      .select(`
        id,
        status,
        event:events!event_rsvps_event_id_fkey(start_time)
      `)
      .eq('user_id', userId);

    if (error) {
      logger.error('Error counting RSVPs', {
        error: error.message,
        source: 'walletRsvpService.getRsvpCountByUserId',
        userId,
      });
      return { upcoming: 0, past: 0, total: 0 };
    }

    const upcoming = (data || []).filter(
      rsvp =>
        rsvp.status === 'confirmed' &&
        rsvp.event &&
        rsvp.event.start_time &&
        new Date(rsvp.event.start_time) > now
    ).length;

    const past = (data || []).filter(
      rsvp =>
        rsvp.event &&
        rsvp.event.start_time &&
        new Date(rsvp.event.start_time) <= now
    ).length;

    return {
      upcoming,
      past,
      total: (data || []).length,
    };
  },
};
