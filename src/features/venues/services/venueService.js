import { supabase } from '@/shared';
import { logger } from '@/shared';
import { createService } from '@/shared';
// Base CRUD operations from factory
const baseService = createService({
    tableName: 'venues',
    serviceName: 'venueService',
    defaultSelect: 'id, name, address_line_1, address_line_2, city, state, zip_code, capacity, website, image_url',
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
    async searchVenues(query) {
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
        return (data || []);
    },
    /**
     * Fetch venues by city
     */
    async getVenuesByCity(city) {
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
        return (data || []);
    },
    /**
     * Get venue name only (lightweight query)
     */
    async getVenueName(venueId) {
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
    async getVenueCapacity(venueId) {
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
    async hasEvents(venueId) {
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
    async getEventCount(venueId) {
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
    async getVenuesWithFilters(filters) {
        let query = supabase
            .from('venues')
            .select('id, name, address_line_1, address_line_2, city, state, zip_code, capacity, website, image_url');
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
        return (data || []);
    },
    /**
     * Get unique cities from venues
     */
    async getUniqueCities() {
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
        const cities = [...new Set((data || []).map(v => v.city).filter((city) => Boolean(city)))];
        return cities;
    },
};
