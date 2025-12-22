import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { venueService, } from '@/features/venues/services/venueService';
/**
 * Venue Queries
 *
 * Centralized React Query hooks for all venue-related data operations.
 * Eliminates duplicate query definitions across components.
 *
 * Usage:
 * ```ts
 * const { data: venue } = useVenueById(venueId);
 * const { data: venues } = useVenues();
 * const createVenueMutation = useCreateVenue();
 * ```
 */
// ============================================================================
// Query Keys
// ============================================================================
export const venueKeys = {
    all: ['venues'],
    lists: () => [...venueKeys.all, 'list'],
    list: (filters) => [...venueKeys.lists(), filters],
    details: () => [...venueKeys.all, 'detail'],
    detail: (id) => [...venueKeys.details(), id],
    capacity: (id) => [...venueKeys.all, 'capacity', id],
    eventCount: (id) => [...venueKeys.all, 'eventCount', id],
    cities: () => [...venueKeys.all, 'cities'],
    search: (query) => [...venueKeys.all, 'search', query],
};
// ============================================================================
// Query Hooks
// ============================================================================
/**
 * Fetch a single venue by ID
 *
 * @param venueId - Venue ID
 * @param options.enabled - Enable/disable query (default: true when venueId exists)
 */
export function useVenueById(venueId, options) {
    return useQuery({
        queryKey: venueKeys.detail(venueId || ''),
        queryFn: () => {
            if (!venueId)
                throw new Error('Venue ID is required');
            return venueService.getVenueById(venueId);
        },
        enabled: Boolean(venueId) && (options?.enabled ?? true),
    });
}
/**
 * Fetch all venues
 */
export function useVenues() {
    return useQuery({
        queryKey: venueKeys.lists(),
        queryFn: () => venueService.getVenues(),
    });
}
/**
 * Fetch venues with filters
 *
 * @param filters - Optional filters (city, minCapacity, maxCapacity)
 */
export function useVenuesWithFilters(filters) {
    return useQuery({
        queryKey: venueKeys.list(filters),
        queryFn: () => venueService.getVenuesWithFilters(filters),
    });
}
/**
 * Search venues by name
 *
 * @param query - Search query string
 */
export function useSearchVenues(query) {
    return useQuery({
        queryKey: venueKeys.search(query),
        queryFn: () => venueService.searchVenues(query),
        enabled: query.trim().length > 0,
    });
}
/**
 * Fetch venue capacity
 *
 * @param venueId - Venue ID
 */
export function useVenueCapacity(venueId) {
    return useQuery({
        queryKey: venueKeys.capacity(venueId || ''),
        queryFn: () => {
            if (!venueId)
                throw new Error('Venue ID is required');
            return venueService.getVenueCapacity(venueId);
        },
        enabled: Boolean(venueId),
        staleTime: 5 * 60 * 1000, // 5 minutes - venue capacity rarely changes
    });
}
/**
 * Fetch event count for a venue
 *
 * @param venueId - Venue ID
 */
export function useVenueEventCount(venueId) {
    return useQuery({
        queryKey: venueKeys.eventCount(venueId || ''),
        queryFn: () => {
            if (!venueId)
                throw new Error('Venue ID is required');
            return venueService.getEventCount(venueId);
        },
        enabled: Boolean(venueId),
    });
}
/**
 * Check if a venue has events
 *
 * @param venueId - Venue ID
 */
export function useVenueHasEvents(venueId) {
    return useQuery({
        queryKey: [...venueKeys.eventCount(venueId || ''), 'hasEvents'],
        queryFn: () => {
            if (!venueId)
                throw new Error('Venue ID is required');
            return venueService.hasEvents(venueId);
        },
        enabled: Boolean(venueId),
    });
}
/**
 * Fetch unique cities from all venues
 */
export function useVenueCities() {
    return useQuery({
        queryKey: venueKeys.cities(),
        queryFn: () => venueService.getUniqueCities(),
        staleTime: 10 * 60 * 1000, // 10 minutes - cities list rarely changes
    });
}
/**
 * Fetch venues by city
 *
 * @param city - City name
 */
export function useVenuesByCity(city) {
    return useQuery({
        queryKey: [...venueKeys.lists(), 'city', city],
        queryFn: () => {
            if (!city)
                throw new Error('City is required');
            return venueService.getVenuesByCity(city);
        },
        enabled: Boolean(city),
    });
}
// ============================================================================
// Mutation Hooks
// ============================================================================
/**
 * Create a new venue
 *
 * Automatically invalidates venue list queries on success
 */
export function useCreateVenue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (venueData) => venueService.createVenue(venueData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: venueKeys.lists() });
            queryClient.invalidateQueries({ queryKey: venueKeys.cities() });
        },
    });
}
/**
 * Update an existing venue
 *
 * Automatically invalidates venue detail and list queries on success
 */
export function useUpdateVenue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => venueService.updateVenue(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: venueKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: venueKeys.lists() });
            queryClient.invalidateQueries({ queryKey: venueKeys.cities() });
        },
    });
}
/**
 * Delete a venue
 *
 * Automatically invalidates venue list queries on success
 */
export function useDeleteVenue() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (venueId) => venueService.deleteVenue(venueId),
        onSuccess: (_, venueId) => {
            queryClient.removeQueries({ queryKey: venueKeys.detail(venueId) });
            queryClient.invalidateQueries({ queryKey: venueKeys.lists() });
            queryClient.invalidateQueries({ queryKey: venueKeys.cities() });
        },
    });
}
