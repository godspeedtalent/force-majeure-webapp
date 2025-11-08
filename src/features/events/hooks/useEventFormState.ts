import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';

/**
 * Shared state and types for event forms
 */

export interface UndercardArtist {
  artistId: string;
}

export interface TicketTier {
  name: string;
  description?: string;
  priceInCents: number;
  quantity: number;
  hideUntilPreviousSoldOut: boolean;
}

export interface EventFormState {
  headlinerId: string;
  eventDate: Date | undefined;
  endTime: string;
  isAfterHours: boolean;
  venueId: string;
  venueCapacity: number;
  undercardArtists: UndercardArtist[];
  ticketTiers: TicketTier[];
  heroImage: string;
}

export interface EventFormActions {
  setHeadlinerId: (id: string) => void;
  setEventDate: (date: Date | undefined) => void;
  setEndTime: (time: string) => void;
  setIsAfterHours: (isAfterHours: boolean) => void;
  setVenueId: (id: string) => void;
  setVenueCapacity: (capacity: number) => void;
  setUndercardArtists: (artists: UndercardArtist[]) => void;
  setTicketTiers: (tiers: TicketTier[]) => void;
  setHeroImage: (image: string) => void;
  resetForm: () => void;
}

/**
 * useEventFormState
 *
 * Shared hook for managing event form state (both create and edit).
 * Eliminates duplicate state management code between FmCreateEventButton and FmEditEventButton.
 *
 * @param initialState - Optional initial state for editing existing events
 */
export function useEventFormState(initialState?: Partial<EventFormState>) {
  const [headlinerId, setHeadlinerId] = useState<string>(initialState?.headlinerId || '');
  const [eventDate, setEventDate] = useState<Date | undefined>(initialState?.eventDate);
  const [endTime, setEndTime] = useState<string>(initialState?.endTime || '02:00');
  const [isAfterHours, setIsAfterHours] = useState(initialState?.isAfterHours || false);
  const [venueId, setVenueId] = useState<string>(initialState?.venueId || '');
  const [venueCapacity, setVenueCapacity] = useState<number>(initialState?.venueCapacity || 0);
  const [undercardArtists, setUndercardArtists] = useState<UndercardArtist[]>(
    initialState?.undercardArtists || []
  );
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>(initialState?.ticketTiers || []);
  const [heroImage, setHeroImage] = useState<string>(initialState?.heroImage || '');

  // Fetch venue capacity when venue changes
  useEffect(() => {
    if (venueId) {
      supabase
        .from('venues' as any)
        .select('capacity')
        .eq('id', venueId)
        .single()
        .then(({ data, error }: any) => {
          if (error) {
            console.error('Error fetching venue capacity:', error);
            toast.error('Failed to fetch venue capacity', {
              description: 'Using default capacity of 100',
            });
            setVenueCapacity(100);
            return;
          }

          if (data && data.capacity) {
            setVenueCapacity(data.capacity);

            // Only initialize default tiers if no tiers exist (for create mode)
            if (ticketTiers.length === 0) {
              const capacity = data.capacity;
              const tierCapacity = Math.floor(capacity / 3);
              const remainder = capacity % 3;

              setTicketTiers([
                {
                  name: 'GA1',
                  priceInCents: 0,
                  quantity: tierCapacity + (remainder > 0 ? 1 : 0),
                  hideUntilPreviousSoldOut: false,
                },
                {
                  name: 'GA2',
                  priceInCents: 0,
                  quantity: tierCapacity + (remainder > 1 ? 1 : 0),
                  hideUntilPreviousSoldOut: false,
                },
                {
                  name: 'GA3',
                  priceInCents: 0,
                  quantity: tierCapacity,
                  hideUntilPreviousSoldOut: false,
                },
              ]);
            }
          }
        });
    }
  }, [venueId]); // Don't include ticketTiers to avoid infinite loop

  // Reset form helper
  const resetForm = useCallback(() => {
    setHeadlinerId('');
    setEventDate(undefined);
    setEndTime('02:00');
    setIsAfterHours(false);
    setVenueId('');
    setVenueCapacity(0);
    setUndercardArtists([]);
    setTicketTiers([]);
    setHeroImage('');
  }, []);

  const state: EventFormState = {
    headlinerId,
    eventDate,
    endTime,
    isAfterHours,
    venueId,
    venueCapacity,
    undercardArtists,
    ticketTiers,
    heroImage,
  };

  const actions: EventFormActions = {
    setHeadlinerId,
    setEventDate,
    setEndTime,
    setIsAfterHours,
    setVenueId,
    setVenueCapacity,
    setUndercardArtists,
    setTicketTiers,
    setHeroImage,
    resetForm,
  };

  return { state, actions };
}
