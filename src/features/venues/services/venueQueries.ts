/**
 * Venue Query Service
 *
 * Centralized query builders for venue-related database operations.
 */

import { supabase } from '@/shared';
import type { Venue } from '@/features/events/types';

/**
 * Get a single venue by ID
 */
export const getVenueById = async (venueId: string) => {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .single();

  if (error) throw error;
  return data as unknown as Venue;
};

/**
 * Get all venues
 */
export const getAllVenues = async () => {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, address_line_1, address_line_2, city, state, zip_code, capacity, website, image_url')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as unknown as Venue[];
};

/**
 * Search venues by name
 */
export const searchVenues = async (searchTerm: string) => {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, address_line_1, address_line_2, city, state, capacity')
    .ilike('name', `%${searchTerm}%`)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as unknown as Venue[];
};

/**
 * Get venues by city
 */
export const getVenuesByCity = async (city: string) => {
  const { data, error } = await supabase
    .from('venues')
    .select('id, name, address_line_1, address_line_2, city, capacity')
    .eq('city', city)
    .order('name', { ascending: true});

  if (error) throw error;
  return data as unknown as Venue[];
};

/**
 * Get venue name only (lightweight query)
 */
export const getVenueName = async (venueId: string) => {
  const { data, error } = await supabase
    .from('venues')
    .select('name')
    .eq('id', venueId)
    .single();

  if (error) throw error;
  return data as Pick<Venue, 'name'>;
};
