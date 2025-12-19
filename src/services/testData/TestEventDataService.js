import { supabase } from '@/shared';
import { TestDataService } from './TestDataService';
import { format } from 'date-fns';
import { logger } from '@/shared';
const DEFAULT_CONFIG = {
    useRealRelations: true,
    supportArtistCount: 3,
    ticketGroupCount: 2,
    hideUntilPreviousSoldOut: true,
    baseTierPrices: [2000, 3000, 4000],
    specialTierPrice: 20000,
    randomizeSoldTickets: true,
};
export class TestEventDataService extends TestDataService {
    constructor(config) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Create a randomized test event
     */
    async createTestEvent() {
        try {
            // Fetch available artists and venues
            const [artistsRes, venuesRes] = await Promise.all([
                supabase.from('artists').select('id, name').limit(100),
                supabase
                    .from('venues')
                    .select('id, name, capacity')
                    .limit(50),
            ]);
            if (artistsRes.error)
                throw artistsRes.error;
            if (venuesRes.error)
                throw venuesRes.error;
            const artists = artistsRes.data || [];
            const venues = venuesRes.data || [];
            if (artists.length === 0 || venues.length === 0) {
                throw new Error('No artists or venues available to create test event');
            }
            // Select random venue and artists
            const venue = this.randomElement(venues);
            const selectedArtists = this.randomElements(artists, 1 + this.config.supportArtistCount);
            const headliner = selectedArtists[0];
            const supports = selectedArtists.slice(1);
            // Unused for now but keep for future reference
            void supports;
            // Generate event date (random future date)
            const eventDate = this.randomFutureDate(7, 90);
            const eventDateString = format(eventDate, 'yyyy-MM-dd');
            const eventTimeString = '21:00'; // 9pm
            const endTimeString = '02:00'; // 2am next day
            // Create event title
            const eventTitle = `${headliner.name} @ ${venue.name}`;
            // Create the event
            const { data: event, error: eventError } = await supabase
                .from('events')
                .insert({
                title: eventTitle,
                headliner_id: headliner.id,
                venue_id: venue.id,
                start_time: `${eventDateString}T${eventTimeString}:00`,
                end_time: `${eventDateString}T${endTimeString}:00`,
                is_after_hours: false,
                test_data: true,
            })
                .select('id')
                .single();
            if (eventError)
                throw eventError;
            if (!event)
                throw new Error('Failed to create event');
            // Generate ticket tiers
            const ticketGroups = this.generateTicketGroups(venue.capacity || 500);
            await this.createTicketTiers(event.id, ticketGroups, venue.capacity || 500);
            return event.id;
        }
        catch (error) {
            logger.error('Error creating test event:', { error });
            throw error;
        }
    }
    /**
     * Generate ticket groups and tiers
     */
    generateTicketGroups(venueCapacity) {
        const groups = [];
        // Calculate tickets per group
        const ticketsPerGroup = Math.floor(venueCapacity * 0.8); // Use 80% of capacity
        const baseTicketsPerTier = Math.floor(ticketsPerGroup / this.config.baseTierPrices.length);
        // Default group with base tiers
        const defaultGroup = {
            name: 'General Admission',
            tiers: this.config.baseTierPrices.map((price, index) => ({
                name: this.getTierName(index),
                description: this.getTierDescription(index),
                priceInCents: price,
                quantity: baseTicketsPerTier,
            })),
        };
        groups.push(defaultGroup);
        // Add special group if configured
        if (this.config.ticketGroupCount > 1) {
            const specialGroup = {
                name: 'VIP',
                tiers: [
                    {
                        name: 'Table',
                        description: 'Reserved table for 4-6 guests',
                        priceInCents: this.config.specialTierPrice,
                        quantity: Math.min(10, Math.floor(venueCapacity * 0.05)), // 5% of capacity or 10 tables max
                    },
                ],
            };
            groups.push(specialGroup);
        }
        return groups;
    }
    /**
     * Create ticket tiers in database
     */
    async createTicketTiers(eventId, ticketGroups, _venueCapacity) {
        const allTiers = [];
        let tierOrder = 0;
        for (const group of ticketGroups) {
            for (const tier of group.tiers) {
                // Calculate sold tickets if randomization is enabled
                let soldInventory = 0;
                let reservedInventory = 0;
                if (this.config.randomizeSoldTickets) {
                    const soldPercentage = Math.random(); // 0-100% sold
                    soldInventory = Math.floor(tier.quantity * soldPercentage);
                    // Small chance of having reserved tickets
                    if (this.randomBoolean(0.2)) {
                        const maxReserved = tier.quantity - soldInventory;
                        reservedInventory = this.randomInt(0, Math.min(5, maxReserved));
                    }
                }
                const availableInventory = tier.quantity - soldInventory - reservedInventory;
                allTiers.push({
                    event_id: eventId,
                    name: tier.name,
                    description: tier.description || null,
                    price_cents: tier.priceInCents,
                    total_tickets: tier.quantity,
                    available_inventory: availableInventory,
                    reserved_inventory: reservedInventory,
                    sold_inventory: soldInventory,
                    tier_order: tierOrder,
                    hide_until_previous_sold_out: this.config.hideUntilPreviousSoldOut,
                    is_active: true,
                    fee_flat_cents: 0,
                    fee_pct_bps: 0,
                });
                tierOrder++;
            }
        }
        const { error } = await supabase
            .from('ticket_tiers')
            .insert(allTiers);
        if (error)
            throw error;
    }
    /**
     * Get tier name based on index
     */
    getTierName(index) {
        const names = ['Early Bird', 'General Admission', 'Door Price'];
        return names[index] || `Tier ${index + 1}`;
    }
    /**
     * Get tier description based on index
     */
    getTierDescription(index) {
        const descriptions = [
            'Limited early bird pricing',
            'Standard admission',
            'Day of show pricing',
        ];
        return descriptions[index] || '';
    }
    /**
     * Delete all test events and their associated data
     */
    async deleteAllTestEvents() {
        try {
            // Get all test event IDs
            const { data: testEvents, error: fetchError } = await supabase
                .from('events')
                .select('id')
                .eq('test_data', true);
            if (fetchError)
                throw fetchError;
            if (!testEvents || testEvents.length === 0)
                return 0;
            const eventIds = testEvents.map(e => e.id);
            // Delete ticket tiers first (foreign key constraint)
            await supabase
                .from('ticket_tiers')
                .delete()
                .in('event_id', eventIds);
            // Delete events
            const { error: deleteError } = await supabase
                .from('events')
                .delete()
                .eq('test_data', true);
            if (deleteError)
                throw deleteError;
            return testEvents.length;
        }
        catch (error) {
            logger.error('Error deleting test events:', { error });
            throw error;
        }
    }
}
