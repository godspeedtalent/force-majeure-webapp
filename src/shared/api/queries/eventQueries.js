import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/features/events/services/eventService';
/**
 * Event Queries
 *
 * Centralized React Query hooks for all event-related data operations.
 * Eliminates duplicate Supabase queries found across 28+ files.
 *
 * Usage:
 * ```ts
 * const { data: event } = useEventById(eventId);
 * const { data: events } = useEvents({ status: 'published' });
 * const createEventMutation = useCreateEvent();
 * ```
 */
// ============================================================================
// Query Keys
// ============================================================================
export const eventKeys = {
    all: ['events'],
    lists: () => [...eventKeys.all, 'list'],
    list: (filters) => [...eventKeys.lists(), filters],
    details: () => [...eventKeys.all, 'detail'],
    detail: (id) => [...eventKeys.details(), id],
};
// ============================================================================
// Query Hooks
// ============================================================================
/**
 * Fetch a single event by ID with all related data
 *
 * @param eventId - Event ID
 * @param options.includeRelations - Include venue, artists, ticket tiers (default: true)
 * @param options.enabled - Enable/disable query (default: true when eventId exists)
 */
export function useEventById(eventId, options) {
    return useQuery({
        queryKey: eventKeys.detail(eventId || ''),
        queryFn: () => {
            if (!eventId)
                throw new Error('Event ID is required');
            return eventService.getEventById(eventId, options?.includeRelations ?? true);
        },
        enabled: Boolean(eventId) && (options?.enabled ?? true),
    });
}
/**
 * Fetch all events with optional filtering
 *
 * @param filters - Optional filters (status, venue_id, date_from, date_to)
 */
export function useEvents(filters) {
    return useQuery({
        queryKey: eventKeys.list(filters),
        queryFn: () => eventService.getEvents(filters),
    });
}
// ============================================================================
// Mutation Hooks
// ============================================================================
/**
 * Create a new event
 *
 * Automatically invalidates event list queries on success
 */
export function useCreateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (eventData) => eventService.createEvent(eventData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
        },
    });
}
/**
 * Update an existing event
 *
 * Automatically invalidates event detail and list queries on success
 */
export function useUpdateEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => eventService.updateEvent(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
        },
    });
}
/**
 * Delete an event
 *
 * Automatically invalidates event list queries on success
 */
export function useDeleteEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (eventId) => eventService.deleteEvent(eventId),
        onSuccess: (_, eventId) => {
            queryClient.removeQueries({ queryKey: eventKeys.detail(eventId) });
            queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
        },
    });
}
/**
 * Update ticket tiers for an event
 *
 * Automatically invalidates event detail query on success
 */
export function useUpdateTicketTiers() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ eventId, tiers }) => eventService.updateTicketTiers(eventId, tiers),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
        },
    });
}
/**
 * Add undercard artists to an event
 *
 * Automatically invalidates event detail query on success
 */
export function useAddUndercardArtists() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ eventId, artistIds }) => eventService.addUndercardArtists(eventId, artistIds),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
        },
    });
}
/**
 * Update undercard artists for an event (replaces all existing)
 *
 * Automatically invalidates event detail query on success
 */
export function useUpdateUndercardArtists() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ eventId, artistIds }) => eventService.updateUndercardArtists(eventId, artistIds),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
        },
    });
}
