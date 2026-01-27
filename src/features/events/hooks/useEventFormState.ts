import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useVenueCapacity } from '@/shared/api/queries/venueQueries';

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
  noHeadliner: boolean;
  eventDate: Date | undefined;
  endTime: string;
  isAfterHours: boolean;
  isTba: boolean;
  venueId: string;
  venueCapacity: number;
  undercardArtists: UndercardArtist[];
  ticketTiers: TicketTier[];
  heroImage: string;
  isRsvpEnabled: boolean;
  rsvpCapacity: number | null;
  maxTicketsPerOrder: number;
}

export interface EventFormActions {
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  setHeadlinerId: (id: string) => void;
  setNoHeadliner: (noHeadliner: boolean) => void;
  setEventDate: (date: Date | undefined) => void;
  setEndTime: (time: string) => void;
  setIsAfterHours: (isAfterHours: boolean) => void;
  setIsTba: (isTba: boolean) => void;
  setVenueId: (id: string) => void;
  setVenueCapacity: (capacity: number) => void;
  setUndercardArtists: (artists: UndercardArtist[]) => void;
  setTicketTiers: (tiers: TicketTier[]) => void;
  setHeroImage: (image: string) => void;
  setIsRsvpEnabled: (enabled: boolean) => void;
  setRsvpCapacity: (capacity: number | null) => void;
  setMaxTicketsPerOrder: (max: number) => void;
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
  const { t } = useTranslation('common');
  const [title, setTitle] = useState<string>(initialState?.title || '');
  const [subtitle, setSubtitle] = useState<string>(initialState?.subtitle || '');
  const [headlinerId, setHeadlinerId] = useState<string>(initialState?.headlinerId || '');
  const [noHeadliner, setNoHeadliner] = useState<boolean>(initialState?.noHeadliner || false);
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
  const [isRsvpEnabled, setIsRsvpEnabled] = useState<boolean>(initialState?.isRsvpEnabled || false);
  const [rsvpCapacity, setRsvpCapacity] = useState<number | null>(initialState?.rsvpCapacity ?? null);
  const [maxTicketsPerOrder, setMaxTicketsPerOrder] = useState<number>(initialState?.maxTicketsPerOrder || 100);

  // Fetch venue capacity using React Query (cached)
  const { data: fetchedVenueCapacity, error: venueCapacityError } = useVenueCapacity(venueId || undefined);

  // Update venue capacity when fetched
  useEffect(() => {
    if (venueCapacityError) {
      toast.error(t('eventForm.venueCapacityFailed'), {
        description: t('eventForm.venueCapacityDefault'),
      });
      setVenueCapacity(100);
      return;
    }

    if (fetchedVenueCapacity !== undefined) {
      setVenueCapacity(fetchedVenueCapacity);

      // Only initialize default tiers if no tiers exist (for create mode)
      if (ticketTiers.length === 0) {
        setTicketTiers([
          {
            name: 'GA',
            description: '',
            priceInCents: 0,
            quantity: fetchedVenueCapacity,
            hideUntilPreviousSoldOut: false,
          },
        ]);
      }
    }
  }, [fetchedVenueCapacity, venueCapacityError, t]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: Intentionally excluding ticketTiers from deps to avoid infinite loop

  // Reset form helper
  const resetForm = useCallback(() => {
    setTitle('');
    setSubtitle('');
    setHeadlinerId('');
    setNoHeadliner(false);
    setEventDate(undefined);
    setEndTime('02:00');
    setIsAfterHours(false);
    setIsTba(false);
    setVenueId('');
    setVenueCapacity(0);
    setUndercardArtists([]);
    setTicketTiers([]);
    setHeroImage('');
    setIsRsvpEnabled(false);
    setRsvpCapacity(null);
    setMaxTicketsPerOrder(100);
  }, []);

  const state: EventFormState = {
    title,
    subtitle,
    headlinerId,
    noHeadliner,
    eventDate,
    endTime,
    isAfterHours,
    isTba,
    venueId,
    venueCapacity,
    undercardArtists,
    ticketTiers,
    heroImage,
    isRsvpEnabled,
    rsvpCapacity,
    maxTicketsPerOrder,
  };

  const actions: EventFormActions = {
    setTitle,
    setSubtitle,
    setHeadlinerId,
    setNoHeadliner,
    setEventDate,
    setEndTime,
    setIsAfterHours,
    setIsTba,
    setVenueId,
    setVenueCapacity,
    setUndercardArtists,
    setTicketTiers,
    setHeroImage,
    setIsRsvpEnabled,
    setRsvpCapacity,
    setMaxTicketsPerOrder,
    resetForm,
  };

  return { state, actions };
}
