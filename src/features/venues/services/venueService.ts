import { supabase } from '@/shared';
import { logger } from '@/shared';
import { createService } from '@/shared';
import type { Venue } from '@/features/events/types';

/**
 * Venue Service
 *
 * Centralized service for all venue-related data operations.
 * Uses createService factory for standard CRUD operations.
 */

export interface CreateVenueData {
  name: string;
  description?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  capacity?: number | null;
  website?: string | null;
  image_url?: string | null;
  logo_url?: string | null;
  // Social media fields
  social_email?: string | null;
  instagram_handle?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  tiktok_handle?: string | null;
  twitter_handle?: string | null;
}

export interface UpdateVenueData extends Partial<CreateVenueData> {
  id: string;
}

export interface VenueFilters {
  city?: string;
  minCapacity?: number;
  maxCapacity?: number;
}

// Base CRUD operations from factory
const baseService = createService<Venue, CreateVenueData>({
  tableName: 'venues',
  serviceName: 'venueService',
  defaultSelect: 'id, name, description, address_line_1, address_line_2, city, state, zip_code, capacity, website, image_url, logo_url, instagram_handle, facebook_url, youtube_url, tiktok_handle, twitter_handle',
  defaultOrder: { column: 'name', ascending: true },
});

export const venueService = {
  // Standard CRUD operations (from factory)
  getVenues: baseService.getAll,
  getVenueById: baseService.getById,
  createVenue: baseService.create,
  updateVenue: baseService.update,
  deleteVenue: baseService.delete,

  // Custom methods that don't fit the standard pattern

  /**
   * Search venues by name
   */
  async searchVenues(query: string): Promise<Venue[]> {
    if (!query.trim()) {
      return this.getVenues();
    }

    const { data, error } = await supabase
      .from('venues')
      .select('id, name, address_line_1, address_line_2, city, state, capacity')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Error searching venues', {
        error: error.message,
        source: 'venueService',
        query,
      });
      throw error;
    }

    return (data || []) as Venue[];
  },

  /**
   * Fetch venues by city
   */
  async getVenuesByCity(city: string): Promise<Venue[]> {
    const { data, error } = await supabase
      .from('venues')
      .select('id, name, address_line_1, address_line_2, city, capacity')
      .eq('city', city)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Error fetching venues by city', {
        error: error.message,
        source: 'venueService',
        city,
      });
      throw error;
    }

    return (data || []) as Venue[];
  },

  /**
   * Get venue name only (lightweight query)
   */
  async getVenueName(venueId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('venues')
      .select('name')
      .eq('id', venueId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Error fetching venue name', {
        error: error.message,
        source: 'venueService',
        venueId,
      });
      throw error;
    }

    return data?.name ?? null;
  },

  /**
   * Get venue capacity
   */
  async getVenueCapacity(venueId: string): Promise<number> {
    const { data, error } = await supabase
      .from('venues')
      .select('capacity')
      .eq('id', venueId)
      .single();

    if (error) {
      logger.error('Error fetching venue capacity', {
        error: error.message,
        source: 'venueService',
        venueId,
      });
      return 100; // Default fallback
    }

    return data?.capacity ?? 100;
  },

  /**
   * Check if a venue has associated events
   */
  async hasEvents(venueId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId);

    if (error) {
      logger.error('Error checking venue events', {
        error: error.message,
        source: 'venueService',
        venueId,
      });
      return false;
    }

    return (count ?? 0) > 0;
  },

  /**
   * Get event count for a venue
   */
  async getEventCount(venueId: string): Promise<number> {
    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId);

    if (error) {
      logger.error('Error counting venue events', {
        error: error.message,
        source: 'venueService',
        venueId,
      });
      return 0;
    }

    return count ?? 0;
  },

  /**
   * Fetch venues with filters
   */
  async getVenuesWithFilters(filters: VenueFilters): Promise<Venue[]> {
    let query = supabase
      .from('venues')
      .select('id, name, description, address_line_1, address_line_2, city, state, zip_code, capacity, website, image_url');

    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.minCapacity !== undefined) {
      query = query.gte('capacity', filters.minCapacity);
    }
    if (filters.maxCapacity !== undefined) {
      query = query.lte('capacity', filters.maxCapacity);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      logger.error('Error fetching venues with filters', {
        error: error.message,
        source: 'venueService',
        filters,
      });
      throw error;
    }

    return (data || []) as Venue[];
  },

  /**
   * Get unique cities from venues
   */
  async getUniqueCities(): Promise<string[]> {
    const { data, error } = await supabase
      .from('venues')
      .select('city')
      .order('city', { ascending: true });

    if (error) {
      logger.error('Error fetching unique cities', {
        error: error.message,
        source: 'venueService',
      });
      throw error;
    }

    const cities = [...new Set((data || []).map(v => v.city).filter((city): city is string => Boolean(city)))];
    return cities;
  },
};
