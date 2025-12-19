import { supabase } from '@/shared';
import { logger } from '@/shared';
export const ticketTierService = {
    /**
     * Fetch ticket tiers for an event
     */
    async getTiersByEventId(eventId) {
        const { data, error } = await supabase
            .from('ticket_tiers')
            .select('*')
            .eq('event_id', eventId)
            .order('tier_order', { ascending: true });
        if (error) {
            logger.error('Error fetching ticket tiers', {
                error: error.message,
                source: 'ticketTierService',
                eventId,
            });
            throw error;
        }
        return (data || []);
    },
    /**
     * Fetch active ticket tiers for an event (for public checkout)
     */
    async getActiveTiersByEventId(eventId) {
        const { data, error } = await supabase
            .from('ticket_tiers')
            .select('*')
            .eq('event_id', eventId)
            .eq('is_active', true)
            .order('tier_order', { ascending: true });
        if (error) {
            logger.error('Error fetching active ticket tiers', {
                error: error.message,
                source: 'ticketTierService',
                eventId,
            });
            throw error;
        }
        return (data || []);
    },
    /**
     * Fetch a single ticket tier by ID
     */
    async getTierById(tierId) {
        const { data, error } = await supabase
            .from('ticket_tiers')
            .select('*')
            .eq('id', tierId)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                // No rows returned
                return null;
            }
            logger.error('Error fetching ticket tier', {
                error: error.message,
                source: 'ticketTierService',
                tierId,
            });
            throw error;
        }
        return data;
    },
    /**
     * Create a new ticket tier
     */
    async createTier(tierData) {
        const insertData = {
            ...tierData,
            is_active: tierData.is_active ?? true,
            tier_order: tierData.tier_order ?? 0,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await supabase.from('ticket_tiers')
            .insert([insertData])
            .select()
            .single();
        if (error) {
            logger.error('Error creating ticket tier', {
                error: error.message,
                source: 'ticketTierService',
                eventId: tierData.event_id,
            });
            throw error;
        }
        return data;
    },
    /**
     * Create multiple ticket tiers at once
     */
    async createTiers(tiers) {
        if (tiers.length === 0) {
            return [];
        }
        const insertData = tiers.map((tier, index) => ({
            ...tier,
            is_active: tier.is_active ?? true,
            tier_order: tier.tier_order ?? index,
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await supabase.from('ticket_tiers')
            .insert(insertData)
            .select();
        if (error) {
            logger.error('Error creating ticket tiers', {
                error: error.message,
                source: 'ticketTierService',
                count: tiers.length,
            });
            throw error;
        }
        return (data || []);
    },
    /**
     * Update a ticket tier
     */
    async updateTier(tierId, tierData) {
        const { data, error } = await supabase
            .from('ticket_tiers')
            .update(tierData)
            .eq('id', tierId)
            .select()
            .single();
        if (error) {
            logger.error('Error updating ticket tier', {
                error: error.message,
                source: 'ticketTierService',
                tierId,
            });
            throw error;
        }
        return data;
    },
    /**
     * Update multiple tiers at once (upsert operation)
     */
    async upsertTiers(eventId, tiers) {
        if (tiers.length === 0) {
            return [];
        }
        const upsertData = tiers.map((tier, index) => ({
            ...tier,
            event_id: eventId,
            tier_order: tier.tier_order ?? index,
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await supabase.from('ticket_tiers')
            .upsert(upsertData, { onConflict: 'id' })
            .select();
        if (error) {
            logger.error('Error upserting ticket tiers', {
                error: error.message,
                source: 'ticketTierService',
                eventId,
                count: tiers.length,
            });
            throw error;
        }
        return (data || []);
    },
    /**
     * Delete a ticket tier
     */
    async deleteTier(tierId) {
        const { error } = await supabase
            .from('ticket_tiers')
            .delete()
            .eq('id', tierId);
        if (error) {
            logger.error('Error deleting ticket tier', {
                error: error.message,
                source: 'ticketTierService',
                tierId,
            });
            throw error;
        }
    },
    /**
     * Delete all ticket tiers for an event
     */
    async deleteTiersByEventId(eventId) {
        const { error } = await supabase
            .from('ticket_tiers')
            .delete()
            .eq('event_id', eventId);
        if (error) {
            logger.error('Error deleting ticket tiers for event', {
                error: error.message,
                source: 'ticketTierService',
                eventId,
            });
            throw error;
        }
    },
    /**
     * Update tier status (activate/deactivate)
     */
    async setTierActive(tierId, isActive) {
        return this.updateTier(tierId, { is_active: isActive });
    },
    /**
     * Update tier ordering for an event
     */
    async updateTierOrder(eventId, tierIds) {
        // Update each tier with its new order
        const updates = tierIds.map((id, index) => supabase
            .from('ticket_tiers')
            .update({ tier_order: index })
            .eq('id', id)
            .eq('event_id', eventId));
        const results = await Promise.all(updates);
        const errors = results.filter(r => r.error);
        if (errors.length > 0) {
            logger.error('Error updating tier order', {
                error: errors[0].error?.message,
                source: 'ticketTierService',
                eventId,
            });
            throw errors[0].error;
        }
    },
    /**
     * Get inventory summary for a tier
     */
    async getTierInventory(tierId) {
        const { data, error } = await supabase
            .from('ticket_tiers')
            .select('total_tickets, available_inventory, reserved_inventory, sold_inventory')
            .eq('id', tierId)
            .single();
        if (error) {
            logger.error('Error fetching tier inventory', {
                error: error.message,
                source: 'ticketTierService',
                tierId,
            });
            throw error;
        }
        return {
            total: data.total_tickets ?? 0,
            available: data.available_inventory ?? 0,
            reserved: data.reserved_inventory ?? 0,
            sold: data.sold_inventory ?? 0,
        };
    },
    /**
     * Replace all tiers for an event (delete and recreate)
     */
    async replaceTiers(eventId, tiers) {
        // Delete existing tiers
        await this.deleteTiersByEventId(eventId);
        // Create new tiers
        if (tiers.length === 0) {
            return [];
        }
        const tiersWithEventId = tiers.map(tier => ({
            ...tier,
            event_id: eventId,
        }));
        return this.createTiers(tiersWithEventId);
    },
};
