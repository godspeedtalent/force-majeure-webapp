import { useState, useEffect, useCallback } from 'react';
import { logger } from '@force-majeure/shared/services/logger';
import { supabase } from '@force-majeure/shared/api/supabase/client';
import { toast } from 'sonner';

/**
 * Shared state and types for event forms
 */

export interface UndercardArtist {
  artistId: string;
}

export interface TicketTier {
  id?: string; // Optional: only present when loaded from database
  name: string;
  description?: string;
  priceInCents: number;
  quantity: number;
  hideUntilPreviousSoldOut: boolean;
  hasOrders?: boolean; // Indicates if this tier has associated orders (cannot be deleted)
}

export interface EventFormState {
  title: string;
  subtitle: string;
  headlinerId: string;
  eventDate: Date | undefined;
  endTime: string;
  isAfterHours: boolean;
  isTba: boolean;
  venueId: string;
  venueCapacity: number;
  undercardArtists: UndercardArtist[];
  ticketTiers: TicketTier[];
  heroImage: string;
}

export interface EventFormActions {
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  setHeadlinerId: (id: string) => void;
  setEventDate: (date: Date | undefined) => void;
  setEndTime: (time: string) => void;
  setIsAfterHours: (isAfterHours: boolean) => void;
  setIsTba: (isTba: boolean) => void;
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
  const [title, setTitle] = useState<string>(initialState?.title || '');
  const [subtitle, setSubtitle] = useState<string>(initialState?.subtitle || '');
  const [headlinerId, setHeadlinerId] = useState<string>(initialState?.headlinerId || '');
  const [eventDate, setEventDate] = useState<Date | undefined>(initialState?.eventDate);
  const [endTime, setEndTime] = useState<string>(initialState?.endTime || '02:00');
  const [isAfterHours, setIsAfterHours] = useState(initialState?.isAfterHours || false);
  const [isTba, setIsTba] = useState(initialState?.isTba || false);
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
        .from('venues')
        .select('capacity')
        .eq('id', venueId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            logger.error('Error fetching venue capacity:', { error, venueId });
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

              setTicketTiers([
                {
                  name: 'GA',
                  description: '',
                  priceInCents: 0,
                  quantity: capacity,
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
    setTitle('');
    setSubtitle('');
    setHeadlinerId('');
    setEventDate(undefined);
    setEndTime('02:00');
    setIsAfterHours(false);
    setIsTba(false);
    setVenueId('');
    setVenueCapacity(0);
    setUndercardArtists([]);
    setTicketTiers([]);
    setHeroImage('');
  }, []);

  const state: EventFormState = {
    title,
    subtitle,
    headlinerId,
    eventDate,
    endTime,
    isAfterHours,
    isTba,
    venueId,
    venueCapacity,
    undercardArtists,
    ticketTiers,
    heroImage,
  };

  const actions: EventFormActions = {
    setTitle,
    setSubtitle,
    setHeadlinerId,
    setEventDate,
    setEndTime,
    setIsAfterHours,
    setIsTba,
    setVenueId,
    setVenueCapacity,
    setUndercardArtists,
    setTicketTiers,
    setHeroImage,
    resetForm,
  };

  return { state, actions };
}
