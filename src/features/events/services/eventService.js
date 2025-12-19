import { supabase } from '@/shared';
import { logger } from '@/shared';
export const eventService = {
    /**
     * Fetch a single event by ID with related data
     */
    async getEventById(eventId, includeRelations = true) {
        const query = supabase.from('events').select(includeRelations
            ? `
          *,
          venue:venues(*),
          headliner:artists!events_headliner_id_fkey(*),
          undercard_artists:event_artists(
            id,
            event_id,
            artist_id,
            set_time,
            set_order,
            artist:artists(*)
          ),
          ticket_tiers(*)
        `
            : '*');
        const { data, error } = await query.eq('id', eventId).single();
        if (error)
            throw error;
        return data;
    },
    /**
     * Fetch events with optional filtering
     */
    async getEvents(filters) {
        let query = supabase.from('events').select(`
      *,
      venue:venues(id, name, address:address_line_1, city, capacity, image_url),
      headliner:artists!events_headliner_id_fkey(id, name, image_url, genre)
    `);
        if (filters?.status) {
            query = query.eq('status', filters.status);
        }
        if (filters?.venue_id) {
            query = query.eq('venue_id', filters.venue_id);
        }
        if (filters?.date_from) {
            query = query.gte('start_time', filters.date_from);
        }
        if (filters?.date_to) {
            query = query.lte('start_time', filters.date_to);
        }
        const { data, error } = await query.order('start_time', { ascending: true });
        if (error)
            throw error;
        return data;
    },
    /**
     * Create a new event (defaults to draft status)
     */
    async createEvent(eventData) {
        // Add 'name' field for database compatibility
        // Note: status defaults to 'draft' in the database
        const insertData = {
            ...eventData,
            name: eventData.title || 'Untitled Event',
        };
        const { data, error } = await supabase
            .from('events')
            .insert([insertData])
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    /**
     * Update an existing event
     */
    async updateEvent(eventId, eventData) {
        const { data, error } = await supabase
            .from('events')
            .update(eventData)
            .eq('id', eventId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    /**
     * Update event status (publish, make invisible, etc.)
     */
    async updateEventStatus(eventId, status) {
        const { data, error } = await supabase
            .from('events')
            .update({ status }) // Type assertion until Supabase types are regenerated
            .eq('id', eventId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    },
    /**
     * Get order count for an event
     */
    async getEventOrderCount(eventId) {
        const { count, error } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);
        if (error) {
            logger.error('Error fetching event order count:', { error: error.message, source: 'eventService' });
            return 0;
        }
        return count || 0;
    },
    /**
     * Delete an event
     */
    async deleteEvent(eventId) {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId);
        if (error)
            throw error;
    },
    /**
     * Fetch venue capacity
     */
    async getVenueCapacity(venueId) {
        const { data, error } = await supabase
            .from('venues')
            .select('capacity')
            .eq('id', venueId)
            .single();
        if (error) {
            logger.error('Error fetching venue capacity:', error);
            return 100; // Default fallback
        }
        return data?.capacity || 100;
    },
    /**
     * Create ticket tiers for an event
     */
    async createTicketTiers(tiers) {
        const { data, error } = await supabase
            .from('ticket_tiers')
            .insert(tiers)
            .select();
        if (error)
            throw error;
        return data;
    },
    /**
     * Update ticket tiers for an event
     */
    async updateTicketTiers(eventId, tiers) {
        // Delete existing tiers
        await supabase
            .from('ticket_tiers')
            .delete()
            .eq('event_id', eventId);
        // Insert new tiers
        if (tiers.length > 0) {
            const tiersWithNames = tiers.map((tier, index) => ({
                ...tier,
                name: tier.name || 'Unnamed Tier',
                price_cents: tier.price_cents ?? 0,
                total_tickets: tier.total_tickets ?? 0,
                tier_order: tier.tier_order ?? index,
                event_id: eventId,
            }));
            const { data, error } = await supabase
                .from('ticket_tiers')
                .insert(tiersWithNames)
                .select();
            if (error)
                throw error;
            return data;
        }
        return [];
    },
    /**
     * Add undercard artists to an event
     */
    async addUndercardArtists(eventId, artistIds) {
        const undercardData = artistIds.map((artistId) => ({
            event_id: eventId,
            artist_id: artistId,
        }));
        const { error } = await supabase
            .from('event_artists')
            .insert(undercardData);
        if (error)
            throw error;
    },
    /**
     * Remove all undercard artists from an event
     */
    async removeUndercardArtists(eventId) {
        const { error } = await supabase
            .from('event_artists')
            .delete()
            .eq('event_id', eventId);
        if (error)
            throw error;
    },
    /**
     * Update undercard artists for an event (remove all and add new)
     */
    async updateUndercardArtists(eventId, artistIds) {
        await this.removeUndercardArtists(eventId);
        if (artistIds.length > 0) {
            await this.addUndercardArtists(eventId, artistIds);
        }
    },
};
