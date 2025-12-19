import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService, CreateEventData } from '@/features/events/services/eventService';
import { Event, TicketTier } from '@/features/events/types';

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
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...eventKeys.lists(), filters] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
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
export function useEventById(
  eventId: string | undefined,
  options?: {
    includeRelations?: boolean;
    enabled?: boolean;
  }
) {
  return useQuery<Event, Error>({
    queryKey: eventKeys.detail(eventId || ''),
    queryFn: () => {
      if (!eventId) throw new Error('Event ID is required');
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
export function useEvents(filters?: {
  status?: 'draft' | 'published' | 'cancelled';
  venue_id?: string;
  date_from?: string;
  date_to?: string;
}) {
  return useQuery<Event[], Error>({
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

  return useMutation<Event, Error, CreateEventData>({
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

  return useMutation<Event, Error, { id: string; data: Partial<CreateEventData> }>({
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

  return useMutation<void, Error, string>({
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

  return useMutation<TicketTier[], Error, { eventId: string; tiers: Partial<TicketTier>[] }>({
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

  return useMutation<void, Error, { eventId: string; artistIds: string[] }>({
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

  return useMutation<void, Error, { eventId: string; artistIds: string[] }>({
    mutationFn: ({ eventId, artistIds }) => eventService.updateUndercardArtists(eventId, artistIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(variables.eventId) });
    },
  });
}
