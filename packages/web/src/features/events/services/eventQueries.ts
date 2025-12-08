/**
 * Event Query Service
 *
 * Centralized query builders for event-related database operations.
 * All event queries should use these functions to ensure consistency.
 */

import { supabase } from '@force-majeure/shared/api/supabase/client';
import type { Event } from '../types';

/**
 * Get a single event with all relations (venue, headliner, undercard artists, ticket tiers)
 */
export const getEventWithRelations = async (eventId: string) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      venues(id, name, address, city, state, zip_code, capacity, website_url, image_url),
      headliner:artists!events_headliner_id_fkey(id, name, bio, image_url, spotify_id, website_url, genre),
      undercard_artists:event_artists(
        id,
        event_id,
        artist_id,
        set_time,
        set_order,
        artist:artists(id, name, image_url)
      ),
      ticket_tiers(
        id,
        event_id,
        name,
        description,
        price_cents,
        fee_flat_cents,
        fee_pct_bps,
        total_tickets,
        quantity_available,
        available_inventory,
        reserved_inventory,
        sold_inventory,
        quantity_sold,
        tier_order,
        is_active,
        hide_until_previous_sold_out,
        sales_start_date,
        sales_end_date,
        created_at,
        updated_at
      )
    `)
    .eq('id', eventId)
    .single();

  if (error) throw error;
  return data as unknown as Event;
};

/**
 * Get all events with basic relations (venue, headliner only)
 */
export const getAllEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      subtitle,
      description,
      start_time,
      end_time,
      venue_id,
      headliner_id,
      image_url,
      status,
      is_tba,
      is_after_hours,
      created_at,
      updated_at,
      venues(id, name, city),
      headliner:artists!events_headliner_id_fkey(id, name, image_url)
    `)
    .order('start_time', { ascending: false });

  if (error) throw error;
  return data as unknown as Event[];
};

/**
 * Get published events only
 */
export const getPublishedEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      subtitle,
      start_time,
      end_time,
      image_url,
      status,
      venues(id, name, city),
      headliner:artists!events_headliner_id_fkey(id, name, image_url)
    `)
    .eq('status', 'published')
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data as unknown as Event[];
};

/**
 * Get events by venue ID
 */
export const getEventsByVenue = async (venueId: string) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      start_time,
      end_time,
      image_url,
      status,
      headliner:artists!events_headliner_id_fkey(id, name, image_url)
    `)
    .eq('venue_id', venueId)
    .order('start_time', { ascending: false });

  if (error) throw error;
  return data as unknown as Event[];
};

/**
 * Get events by artist ID (as headliner)
 */
export const getEventsByHeadliner = async (artistId: string) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      start_time,
      end_time,
      image_url,
      status,
      venues(id, name, city)
    `)
    .eq('headliner_id', artistId)
    .order('start_time', { ascending: false });

  if (error) throw error;
  return data as unknown as Event[];
};

/**
 * Get upcoming events (future start time, published only)
 */
export const getUpcomingEvents = async (limit?: number) => {
  let query = supabase
    .from('events')
    .select(`
      id,
      title,
      subtitle,
      start_time,
      image_url,
      venues(id, name, city),
      headliner:artists!events_headliner_id_fkey(id, name, image_url)
    `)
    .eq('status', 'published')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as unknown as Event[];
};

/**
 * Get past events (past start time)
 */
export const getPastEvents = async (limit?: number) => {
  let query = supabase
    .from('events')
    .select(`
      id,
      title,
      start_time,
      image_url,
      venues(id, name, city),
      headliner:artists!events_headliner_id_fkey(id, name, image_url)
    `)
    .lt('start_time', new Date().toISOString())
    .order('start_time', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as unknown as Event[];
};

/**
 * Search events by title
 */
export const searchEvents = async (searchTerm: string) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      start_time,
      image_url,
      status,
      venues(id, name, city),
      headliner:artists!events_headliner_id_fkey(id, name, image_url)
    `)
    .ilike('title', `%${searchTerm}%`)
    .order('start_time', { ascending: false });

  if (error) throw error;
  return data as unknown as Event[];
};
