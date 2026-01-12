import { format } from 'date-fns';
import { useAsyncMutation } from '@/shared';
import { eventService } from '../services/eventService';
import { EventFormState } from './useEventData';
import { getArtistName } from '@/features/artists/services/artistQueries';
import { getVenueName } from '@/features/venues/services/venueQueries';

/**
 * useEventForm Hook
 *
 * Handles event form validation and submission logic.
 * Shared between create and edit flows.
 */

export interface UseEventFormOptions {
  eventId?: string;
  onSuccess?: () => void;
  mode: 'create' | 'edit';
}

export function useEventForm(options: UseEventFormOptions) {
  const { eventId, onSuccess, mode } = options;

  const { execute: submitForm, isLoading } = useAsyncMutation({
    mutationFn: async (formState: EventFormState) => {
      // Fetch artist and venue names for title using centralized query services
      const [headliner, venue] = await Promise.all([
        getArtistName(formState.headlinerId),
        getVenueName(formState.venueId),
      ]);

      // Construct event title
      const eventTitle =
        headliner && venue
          ? `${headliner.name} @ ${venue.name}`
          : headliner
            ? headliner.name
            : 'Event';

      // Format date and time
      const eventDateString = formState.eventDate
        ? format(formState.eventDate, 'yyyy-MM-dd')
        : '';
      const eventTimeString = formState.eventDate
        ? format(formState.eventDate, 'HH:mm')
        : '';

      // Prepare event data
      const eventData = {
        name: eventTitle,
        title: eventTitle,
        headliner_id: formState.headlinerId || null,
        venue_id: formState.venueId || null,
        date: eventDateString,
        time: eventTimeString,
        doors_time: formState.isAfterHours
          ? undefined
          : formState.endTime || undefined,
        image_url: formState.heroImage || null,
        status: 'published' as const,
      };

      let resultEventId: string;

      if (mode === 'edit' && eventId) {
        // Update existing event
        await eventService.updateEvent(eventId, eventData);
        resultEventId = eventId;
      } else {
        // Create new event
        const newEvent = await eventService.createEvent({
          ...eventData,
          description: undefined,
        });
        resultEventId = newEvent.id;
      }

      // Update undercard artists
      const artistIds = formState.undercardArtists
        .map(a => a.artistId)
        .filter(Boolean);
      await eventService.updateUndercardArtists(resultEventId, artistIds);

      // Update ticket tiers
      if (formState.ticketTiers.length > 0) {
        const tiers = formState.ticketTiers.map((tier, index) => ({
          event_id: resultEventId,
          name: tier.name,
          description: tier.description || null,
          price_cents: tier.priceInCents,
          total_tickets: tier.quantity,
          available_inventory: tier.quantity,
          reserved_inventory: 0,
          sold_inventory: 0,
          tier_order: index,
          hide_until_previous_sold_out: tier.hideUntilPreviousSoldOut,
          is_active: true,
          fee_flat_cents: 0,
          fee_pct_bps: 0,
        }));

        await eventService.updateTicketTiers(resultEventId, tiers);
      }

      return { eventId: resultEventId, eventTitle };
    },
    successMessage:
      mode === 'edit'
        ? 'Event updated successfully'
        : 'Event created successfully',
    errorMessage:
      mode === 'edit' ? 'Failed to update event' : 'Failed to create event',
    onSuccess: () => {
      // Delay callback to ensure DB consistency
      setTimeout(() => {
        onSuccess?.();
      }, 500);
    },
    throwOnError: true, // Maintain legacy behavior
  });

  const validateForm = (formState: EventFormState): string | null => {
    if (!formState.headlinerId) {
      return 'Please select a headliner';
    }
    if (!formState.venueId) {
      return 'Please select a venue';
    }
    if (!formState.eventDate) {
      return 'Please select an event date';
    }
    if (formState.ticketTiers.length === 0) {
      return 'Please add at least one ticket tier';
    }

    // Validate ticket tiers
    for (const tier of formState.ticketTiers) {
      if (!tier.name) {
        return 'All ticket tiers must have a name';
      }
      if (tier.priceInCents < 0) {
        return 'Ticket tier price cannot be negative';
      }
      if (tier.quantity <= 0) {
        return 'All ticket tiers must have a quantity greater than 0';
      }
    }

    return null;
  };

  const calculateTicketStats = (formState: EventFormState) => {
    const totalTickets = formState.ticketTiers.reduce(
      (sum, tier) => sum + tier.quantity,
      0
    );
    const ticketsOverCapacity = totalTickets > formState.venueCapacity;
    const ticketsUnderCapacity = totalTickets < formState.venueCapacity;

    const getStatusMessage = () => {
      if (!formState.venueCapacity) return '';
      if (ticketsOverCapacity) {
        return `Over capacity by ${totalTickets - formState.venueCapacity} tickets`;
      }
      if (ticketsUnderCapacity) {
        return `${formState.venueCapacity - totalTickets} tickets remaining`;
      }
      return 'All tickets allocated';
    };

    return {
      totalTickets,
      ticketsOverCapacity,
      ticketsUnderCapacity,
      statusMessage: getStatusMessage(),
    };
  };

  return {
    submitForm,
    isLoading,
    validateForm,
    calculateTicketStats,
  };
}
