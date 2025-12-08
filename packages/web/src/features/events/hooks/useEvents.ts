/**
 * Event Query Hooks
 *
 * Re-exports from centralized query utilities for backward compatibility.
 * New code should import directly from '@/shared/api/queries'.
 *
 * @deprecated Import from '@/shared/api/queries' instead
 */
export {
  useEvents,
  useEventById as useEvent,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useVenueCapacity,
  useCreateTicketTiers,
  useUpdateTicketTiers,
  useAddUndercardArtists,
  useUpdateUndercardArtists,
} from '@/shared/api/queries';

// Re-export Event type from centralized location
export type { Event } from '../types';
