import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventService } from './eventService';
// Mock Supabase client
vi.mock('@/shared/api/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
    },
}));
// Mock logger
vi.mock('@/shared/services/logger', () => ({
    logger: {
        error: vi.fn(),
    },
}));
import { supabase } from '@/shared';
import { logger } from '@/shared';
describe('eventService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('getEventById', () => {
        it('should fetch an event with relations by default', async () => {
            const mockEvent = {
                id: 'event-1',
                title: 'Test Event',
                venue: { id: 'venue-1', name: 'Test Venue' },
                headliner: { id: 'artist-1', name: 'Test Artist' },
                undercard_artists: [],
                ticket_tiers: [],
            };
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.getEventById('event-1');
            expect(supabase.from).toHaveBeenCalledWith('events');
            expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'event-1');
            expect(result).toEqual(mockEvent);
        });
        it('should fetch event without relations when includeRelations is false', async () => {
            const mockEvent = { id: 'event-1', title: 'Test Event' };
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.getEventById('event-1', false);
            expect(mockBuilder.select).toHaveBeenCalledWith('*');
            expect(result).toEqual(mockEvent);
        });
        it('should throw on error', async () => {
            const mockError = { message: 'Database error' };
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await expect(eventService.getEventById('event-1')).rejects.toEqual(mockError);
        });
    });
    describe('getEvents', () => {
        it('should fetch all events with default ordering', async () => {
            const mockEvents = [
                { id: '1', title: 'Event A', start_time: '2024-01-01' },
                { id: '2', title: 'Event B', start_time: '2024-01-02' },
            ];
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.getEvents();
            expect(supabase.from).toHaveBeenCalledWith('events');
            expect(mockBuilder.order).toHaveBeenCalledWith('start_time', { ascending: true });
            expect(result).toEqual(mockEvents);
        });
        it('should apply status filter', async () => {
            const mockEvents = [{ id: '1', status: 'published' }];
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await eventService.getEvents({ status: 'published' });
            expect(mockBuilder.eq).toHaveBeenCalledWith('status', 'published');
        });
        it('should apply venue_id filter', async () => {
            const mockEvents = [{ id: '1', venue_id: 'venue-1' }];
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await eventService.getEvents({ venue_id: 'venue-1' });
            expect(mockBuilder.eq).toHaveBeenCalledWith('venue_id', 'venue-1');
        });
        it('should apply date range filters', async () => {
            const mockEvents = [{ id: '1' }];
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await eventService.getEvents({
                date_from: '2024-01-01',
                date_to: '2024-12-31',
            });
            expect(mockBuilder.gte).toHaveBeenCalledWith('start_time', '2024-01-01');
            expect(mockBuilder.lte).toHaveBeenCalledWith('start_time', '2024-12-31');
        });
        it('should return empty array when no events', async () => {
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.getEvents();
            expect(result).toEqual([]);
        });
        it('should throw on error', async () => {
            const mockError = { message: 'Database error' };
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                gte: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await expect(eventService.getEvents()).rejects.toEqual(mockError);
        });
    });
    describe('createEvent', () => {
        it('should create an event with name from title', async () => {
            const mockEvent = {
                id: 'new-event',
                title: 'New Event',
                name: 'New Event',
            };
            const mockBuilder = {
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.createEvent({
                title: 'New Event',
                venue_id: 'venue-1',
                headliner_id: 'artist-1',
            });
            expect(mockBuilder.insert).toHaveBeenCalledWith([
                expect.objectContaining({
                    title: 'New Event',
                    name: 'New Event',
                    venue_id: 'venue-1',
                    headliner_id: 'artist-1',
                }),
            ]);
            expect(result).toEqual(mockEvent);
        });
        it('should use default name when title is empty', async () => {
            const mockEvent = { id: 'new-event', name: 'Untitled Event' };
            const mockBuilder = {
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await eventService.createEvent({
                title: '',
                venue_id: null,
                headliner_id: null,
            });
            expect(mockBuilder.insert).toHaveBeenCalledWith([
                expect.objectContaining({
                    name: 'Untitled Event',
                }),
            ]);
        });
        it('should throw on error', async () => {
            const mockError = { message: 'Insert failed' };
            const mockBuilder = {
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await expect(eventService.createEvent({
                title: 'Test',
                venue_id: null,
                headliner_id: null,
            })).rejects.toEqual(mockError);
        });
    });
    describe('updateEvent', () => {
        it('should update an event', async () => {
            const mockEvent = { id: 'event-1', title: 'Updated Event' };
            const mockBuilder = {
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.updateEvent('event-1', { title: 'Updated Event' });
            expect(mockBuilder.update).toHaveBeenCalledWith({ title: 'Updated Event' });
            expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'event-1');
            expect(result).toEqual(mockEvent);
        });
        it('should throw on error', async () => {
            const mockError = { message: 'Update failed' };
            const mockBuilder = {
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await expect(eventService.updateEvent('event-1', { title: 'Updated' })).rejects.toEqual(mockError);
        });
    });
    describe('updateEventStatus', () => {
        it('should update event status', async () => {
            const mockEvent = { id: 'event-1', status: 'published' };
            const mockBuilder = {
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockEvent, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.updateEventStatus('event-1', 'published');
            expect(mockBuilder.update).toHaveBeenCalledWith({ status: 'published' });
            expect(result).toEqual(mockEvent);
        });
    });
    describe('getEventOrderCount', () => {
        it('should return order count', async () => {
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.getEventOrderCount('event-1');
            expect(supabase.from).toHaveBeenCalledWith('orders');
            expect(mockBuilder.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
            expect(mockBuilder.eq).toHaveBeenCalledWith('event_id', 'event-1');
            expect(result).toBe(10);
        });
        it('should return 0 on error', async () => {
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.getEventOrderCount('event-1');
            expect(result).toBe(0);
            expect(logger.error).toHaveBeenCalled();
        });
        it('should return 0 when count is null', async () => {
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ count: null, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.getEventOrderCount('event-1');
            expect(result).toBe(0);
        });
    });
    describe('deleteEvent', () => {
        it('should delete an event', async () => {
            const mockBuilder = {
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await eventService.deleteEvent('event-1');
            expect(supabase.from).toHaveBeenCalledWith('events');
            expect(mockBuilder.delete).toHaveBeenCalled();
            expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'event-1');
        });
        it('should throw on error', async () => {
            const mockError = { message: 'Delete failed' };
            const mockBuilder = {
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: mockError }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await expect(eventService.deleteEvent('event-1')).rejects.toEqual(mockError);
        });
    });
    describe('getVenueCapacity', () => {
        it('should return venue capacity', async () => {
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { capacity: 500 }, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.getVenueCapacity('venue-1');
            expect(supabase.from).toHaveBeenCalledWith('venues');
            expect(result).toBe(500);
        });
        it('should return default capacity on error', async () => {
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.getVenueCapacity('venue-1');
            expect(result).toBe(100);
            expect(logger.error).toHaveBeenCalled();
        });
        it('should return default when capacity is null', async () => {
            const mockBuilder = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { capacity: null }, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.getVenueCapacity('venue-1');
            expect(result).toBe(100);
        });
    });
    describe('createTicketTiers', () => {
        it('should create multiple ticket tiers', async () => {
            const mockTiers = [
                { id: '1', name: 'GA', price_cents: 2000 },
                { id: '2', name: 'VIP', price_cents: 5000 },
            ];
            const mockBuilder = {
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockResolvedValue({ data: mockTiers, error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.createTicketTiers([
                {
                    event_id: 'event-1',
                    name: 'GA',
                    price_cents: 2000,
                    total_tickets: 100,
                    tier_order: 0,
                    is_active: true,
                    hide_until_previous_sold_out: false,
                },
                {
                    event_id: 'event-1',
                    name: 'VIP',
                    price_cents: 5000,
                    total_tickets: 50,
                    tier_order: 1,
                    is_active: true,
                    hide_until_previous_sold_out: false,
                },
            ]);
            expect(supabase.from).toHaveBeenCalledWith('ticket_tiers');
            expect(result).toEqual(mockTiers);
        });
        it('should throw on error', async () => {
            const mockError = { message: 'Insert failed' };
            const mockBuilder = {
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockResolvedValue({ data: null, error: mockError }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await expect(eventService.createTicketTiers([
                {
                    event_id: 'event-1',
                    name: 'GA',
                    price_cents: 2000,
                    total_tickets: 100,
                    tier_order: 0,
                    is_active: true,
                    hide_until_previous_sold_out: false,
                },
            ])).rejects.toEqual(mockError);
        });
    });
    describe('updateTicketTiers', () => {
        it('should delete existing and insert new tiers', async () => {
            const mockTiers = [{ id: '1', name: 'New Tier' }];
            // First call is delete, second is insert
            let callCount = 0;
            vi.mocked(supabase.from).mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    // Delete call
                    return {
                        delete: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockResolvedValue({ error: null }),
                    };
                }
                // Insert call
                return {
                    insert: vi.fn().mockReturnThis(),
                    select: vi.fn().mockResolvedValue({ data: mockTiers, error: null }),
                };
            });
            const result = await eventService.updateTicketTiers('event-1', [
                { name: 'New Tier', price_cents: 3000, total_tickets: 100 },
            ]);
            expect(result).toEqual(mockTiers);
        });
        it('should return empty array when no tiers provided', async () => {
            const mockBuilder = {
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            const result = await eventService.updateTicketTiers('event-1', []);
            expect(result).toEqual([]);
        });
        it('should use defaults for missing tier properties', async () => {
            const mockTiers = [{ id: '1', name: 'Unnamed Tier' }];
            let callCount = 0;
            let insertData = null;
            vi.mocked(supabase.from).mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return {
                        delete: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockResolvedValue({ error: null }),
                    };
                }
                return {
                    insert: vi.fn().mockImplementation((data) => {
                        insertData = data;
                        return {
                            select: vi.fn().mockResolvedValue({ data: mockTiers, error: null }),
                        };
                    }),
                };
            });
            await eventService.updateTicketTiers('event-1', [{}]);
            expect(insertData).toEqual([
                expect.objectContaining({
                    name: 'Unnamed Tier',
                    price_cents: 0,
                    total_tickets: 0,
                    tier_order: 0,
                    event_id: 'event-1',
                }),
            ]);
        });
    });
    describe('addUndercardArtists', () => {
        it('should add undercard artists', async () => {
            const mockBuilder = {
                insert: vi.fn().mockResolvedValue({ error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await eventService.addUndercardArtists('event-1', ['artist-1', 'artist-2']);
            expect(supabase.from).toHaveBeenCalledWith('event_artists');
            expect(mockBuilder.insert).toHaveBeenCalledWith([
                { event_id: 'event-1', artist_id: 'artist-1' },
                { event_id: 'event-1', artist_id: 'artist-2' },
            ]);
        });
        it('should throw on error', async () => {
            const mockError = { message: 'Insert failed' };
            const mockBuilder = {
                insert: vi.fn().mockResolvedValue({ error: mockError }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await expect(eventService.addUndercardArtists('event-1', ['artist-1'])).rejects.toEqual(mockError);
        });
    });
    describe('removeUndercardArtists', () => {
        it('should remove all undercard artists from event', async () => {
            const mockBuilder = {
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await eventService.removeUndercardArtists('event-1');
            expect(supabase.from).toHaveBeenCalledWith('event_artists');
            expect(mockBuilder.delete).toHaveBeenCalled();
            expect(mockBuilder.eq).toHaveBeenCalledWith('event_id', 'event-1');
        });
        it('should throw on error', async () => {
            const mockError = { message: 'Delete failed' };
            const mockBuilder = {
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: mockError }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await expect(eventService.removeUndercardArtists('event-1')).rejects.toEqual(mockError);
        });
    });
    describe('updateUndercardArtists', () => {
        it('should remove existing and add new artists', async () => {
            // First call is delete, second is insert
            let callCount = 0;
            vi.mocked(supabase.from).mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return {
                        delete: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockResolvedValue({ error: null }),
                    };
                }
                return {
                    insert: vi.fn().mockResolvedValue({ error: null }),
                };
            });
            await eventService.updateUndercardArtists('event-1', ['artist-1', 'artist-2']);
            expect(supabase.from).toHaveBeenCalledTimes(2);
        });
        it('should only remove when no new artists provided', async () => {
            const mockBuilder = {
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null }),
            };
            vi.mocked(supabase.from).mockReturnValue(mockBuilder);
            await eventService.updateUndercardArtists('event-1', []);
            expect(supabase.from).toHaveBeenCalledTimes(1);
            expect(supabase.from).toHaveBeenCalledWith('event_artists');
        });
    });
});
