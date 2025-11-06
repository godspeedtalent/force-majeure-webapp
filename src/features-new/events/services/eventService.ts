import { supabase } from '@/shared/api/supabase/client';
import { Event, TicketTier, Venue } from '../types';

/**
 * Event Service
 *
 * Centralized service for all event-related data operations.
 * Consolidates duplicate Supabase queries found across 15+ files.
 */

export interface CreateEventData {
  title: string;
  description?: string;
  date: string;
  time: string;
  doors_time?: string;
  venue_id: string;
  headliner_id: string;
  image_url?: string;
  status: 'draft' | 'published';
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
}

export interface CreateTicketTierData {
  event_id: string;
  name: string;
  description?: string;
  price_cents: number;
  total_tickets: number;
  tier_order: number;
  is_active: boolean;
  hide_until_previous_sold_out: boolean;
}

export const eventService = {
  /**
   * Fetch a single event by ID with related data
   */
  async getEventById(eventId: string, includeRelations = true) {
    const query = supabase.from('events' as any).select(
      includeRelations
        ? `
          *,
          venue:venues(*),
          headliner:artists!events_headliner_id_fkey(*),
          undercard_artists:event_artists(
            set_order,
            artist:artists(*)
          ),
          ticket_tiers(*)
        `
        : '*'
    );

    const { data, error } = await query.eq('id', eventId).single();

    if (error) throw error;
    return data as unknown as Event;
  },

  /**
   * Fetch events with optional filtering
   */
  async getEvents(filters?: {
    status?: 'draft' | 'published' | 'cancelled';
    venue_id?: string;
    date_from?: string;
    date_to?: string;
  }) {
    let query = supabase.from('events' as any).select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.venue_id) {
      query = query.eq('venue_id', filters.venue_id);
    }
    if (filters?.date_from) {
      query = query.gte('date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('date', filters.date_to);
    }

    const { data, error } = await query.order('date', { ascending: true });

    if (error) throw error;
    return data as unknown as Event[];
  },

  /**
   * Create a new event
   */
  async createEvent(eventData: CreateEventData) {
    const { data, error } = await supabase
      .from('events' as any)
      .insert([eventData])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Event;
  },

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, eventData: Partial<CreateEventData>) {
    const { data, error } = await supabase
      .from('events' as any)
      .update(eventData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Event;
  },

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string) {
    const { error } = await supabase.from('events' as any).delete().eq('id', eventId);

    if (error) throw error;
  },

  /**
   * Fetch venue capacity
   */
  async getVenueCapacity(venueId: string): Promise<number> {
    const { data, error } = await supabase
      .from('venues' as any)
      .select('capacity')
      .eq('id', venueId)
      .single();

    if (error) {
      console.error('Error fetching venue capacity:', error);
      return 100; // Default fallback
    }

    return data?.capacity || 100;
  },

  /**
   * Create ticket tiers for an event
   */
  async createTicketTiers(tiers: CreateTicketTierData[]) {
    const { data, error } = await supabase
      .from('ticket_tiers' as any)
      .insert(tiers)
      .select();

    if (error) throw error;
    return data as unknown as TicketTier[];
  },

  /**
   * Update ticket tiers for an event
   */
  async updateTicketTiers(eventId: string, tiers: Partial<TicketTier>[]) {
    // Delete existing tiers
    await supabase.from('ticket_tiers' as any).delete().eq('event_id', eventId);

    // Insert new tiers
    if (tiers.length > 0) {
      const { data, error } = await supabase
        .from('ticket_tiers' as any)
        .insert(
          tiers.map((tier) => ({
            ...tier,
            event_id: eventId,
          }))
        )
        .select();

      if (error) throw error;
      return data as unknown as TicketTier[];
    }

    return [];
  },

  /**
   * Add undercard artists to an event
   */
  async addUndercardArtists(eventId: string, artistIds: string[]) {
    const undercardData = artistIds.map((artistId, index) => ({
      event_id: eventId,
      artist_id: artistId,
      set_order: index + 1,
    }));

    const { error } = await supabase.from('event_artists' as any).insert(undercardData);

    if (error) throw error;
  },

  /**
   * Remove all undercard artists from an event
   */
  async removeUndercardArtists(eventId: string) {
    const { error } = await supabase
      .from('event_artists' as any)
      .delete()
      .eq('event_id', eventId);

    if (error) throw error;
  },

  /**
   * Update undercard artists for an event (remove all and add new)
   */
  async updateUndercardArtists(eventId: string, artistIds: string[]) {
    await this.removeUndercardArtists(eventId);
    if (artistIds.length > 0) {
      await this.addUndercardArtists(eventId, artistIds);
    }
  },
};
