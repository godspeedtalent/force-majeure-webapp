import { useState, useEffect } from 'react';
import { logger } from '@force-majeure/shared';
import { eventService } from '../services/eventService';
import { Event } from '../types';

/**
 * useEventData Hook
 *
 * Fetches and manages event data for editing.
 * Handles loading state and data transformation.
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

export function useEventData(
  eventId: string | undefined,
  isModalOpen: boolean
) {
  const [isLoading, setIsLoading] = useState(false);
  const [eventData, setEventData] = useState<Event | null>(null);
  const [formState, setFormState] = useState<EventFormState>({
    headlinerId: '',
    eventDate: undefined,
    endTime: '02:00',
    isAfterHours: false,
    venueId: '',
    venueCapacity: 0,
    undercardArtists: [],
    ticketTiers: [],
    heroImage: '',
  });

  // Load event data when modal opens
  useEffect(() => {
    if (isModalOpen && eventId) {
      loadEventData();
    }
  }, [isModalOpen, eventId]);

  // Fetch venue capacity when venue changes
  useEffect(() => {
    if (formState.venueId) {
      eventService.getVenueCapacity(formState.venueId).then(capacity => {
        setFormState(prev => ({ ...prev, venueCapacity: capacity }));
      });
    }
  }, [formState.venueId]);

  const loadEventData = async () => {
    if (!eventId) return;

    setIsLoading(true);
    try {
      const event = await eventService.getEventById(eventId, true);
      setEventData(event);

      // Parse start_time to Date
      let parsedDate: Date | undefined;
      if (event.start_time) {
        try {
          parsedDate = new Date(event.start_time);
        } catch (error) {
          logger.error('Error parsing start_time:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            source: 'useEventData.loadEventData',
            eventId
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

      setFormState({
        headlinerId: event.headliner_id || '',
        eventDate: parsedDate,
        endTime: endTimeStr,
        isAfterHours: event.is_after_hours || false,
        venueId: event.venue_id || '',
        venueCapacity: event.venue?.capacity || 0,
        undercardArtists: undercard,
        ticketTiers: tiers,
        heroImage: event.image_url || '',
      });
    } catch (error) {
      logger.error('Error loading event data:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useEventData.loadEventData',
        eventId
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    eventData,
    formState,
    setFormState,
    reload: loadEventData,
  };
}
