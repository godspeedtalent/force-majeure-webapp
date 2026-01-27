import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/shared';
import { useEventById } from '@/shared/api/queries/eventQueries';
import { useVenueCapacity } from '@/shared/api/queries/venueQueries';
import { Event } from '../types';

/**
 * useEventData Hook
 *
 * Fetches and manages event data for editing.
 * Uses React Query for caching and deduplication of requests.
 */

export interface EventFormState {
  headlinerId: string;
  eventDate: Date | undefined;
  endTime: string;
  isAfterHours: boolean;
  venueId: string;
  venueCapacity: number;
  undercardArtists: Array<{ artistId: string }>;
  ticketTiers: Array<{
    id?: string;
    name: string;
    description?: string;
    priceInCents: number;
    quantity: number;
    hideUntilPreviousSoldOut: boolean;
  }>;
  heroImage: string;
}

const DEFAULT_FORM_STATE: EventFormState = {
  headlinerId: '',
  eventDate: undefined,
  endTime: '02:00',
  isAfterHours: false,
  venueId: '',
  venueCapacity: 0,
  undercardArtists: [],
  ticketTiers: [],
  heroImage: '',
};

/**
 * Transform event data to form state
 */
function transformEventToFormState(event: Event | undefined): EventFormState {
  if (!event) return DEFAULT_FORM_STATE;

  // Parse start_time to Date
  let parsedDate: Date | undefined;
  if (event.start_time) {
    try {
      parsedDate = new Date(event.start_time);
    } catch (error) {
      logger.error('Error parsing start_time:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useEventData.transformEventToFormState',
        eventId: event.id,
      });
    }
  }

  // Transform ticket tiers
  const tiers = (event.ticket_tiers || []).map(tier => ({
    id: tier.id,
    name: tier.name,
    description: tier.description || undefined,
    priceInCents: tier.price_cents,
    quantity: tier.total_tickets || tier.quantity_available || 0,
    hideUntilPreviousSoldOut: tier.hide_until_previous_sold_out || false,
  }));

  // Transform undercard artists
  const undercard = (event.undercard_artists || []).map(ua => ({
    artistId: ua.artist_id,
  }));

  // Parse end time from end_time if available
  let endTimeStr = '02:00';
  if (event.end_time) {
    const endDate = new Date(event.end_time);
    endTimeStr = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  }

  return {
    headlinerId: event.headliner_id || '',
    eventDate: parsedDate,
    endTime: endTimeStr,
    isAfterHours: event.is_after_hours || false,
    venueId: event.venue_id || '',
    venueCapacity: event.venue?.capacity || 0,
    undercardArtists: undercard,
    ticketTiers: tiers,
    heroImage: event.image_url || '',
  };
}

export function useEventData(
  eventId: string | undefined,
  isModalOpen: boolean
) {
  // Use React Query for cached event data fetching
  const {
    data: eventData,
    isLoading: isEventLoading,
    refetch: refetchEvent,
  } = useEventById(eventId, {
    enabled: isModalOpen && !!eventId,
    includeRelations: true,
  });

  // Local form state for editing
  const [formState, setFormState] = useState<EventFormState>(DEFAULT_FORM_STATE);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Fetch venue capacity when venue changes (cached via React Query)
  const { data: venueCapacity } = useVenueCapacity(formState.venueId || undefined);

  // Initialize form state when event data loads
  useEffect(() => {
    if (eventData && isModalOpen && !hasInitialized) {
      const initialState = transformEventToFormState(eventData);
      setFormState(initialState);
      setHasInitialized(true);
    }
  }, [eventData, isModalOpen, hasInitialized]);

  // Reset initialization flag when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      setHasInitialized(false);
    }
  }, [isModalOpen]);

  // Update venue capacity when it changes (from React Query cache)
  useEffect(() => {
    if (venueCapacity !== undefined && venueCapacity !== formState.venueCapacity) {
      setFormState(prev => ({ ...prev, venueCapacity }));
    }
  }, [venueCapacity, formState.venueCapacity]);

  // Memoized reload function
  const reload = useCallback(() => {
    setHasInitialized(false);
    refetchEvent();
  }, [refetchEvent]);

  return {
    isLoading: isEventLoading,
    eventData: eventData || null,
    formState,
    setFormState,
    reload,
  };
}
