import { useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import { EventFormState } from './useEventFormState';
import { useEventFormValidation } from './useEventFormValidation';

interface UseEventFormSubmitOptions {
  mode: 'create' | 'edit';
  eventId?: string;
  onSuccess?: (eventId: string) => void;
  onError?: (error: Error) => void;
  onValidationError?: (error: string) => void;
}

/**
 * useEventFormSubmit
 *
 * Shared submit logic for event forms (create and edit modes).
 * Eliminates duplicate submission code between FmCreateEventButton and FmEditEventButton.
 */
export function useEventFormSubmit(options: UseEventFormSubmitOptions) {
  const { mode, eventId, onSuccess, onError, onValidationError } = options;
  const [isLoading, setIsLoading] = useState(false);
  const { validateForm } = useEventFormValidation();

  const submitEvent = async (state: EventFormState) => {
    // Validate form
    const validationError = validateForm(state);
    if (validationError) {
      onValidationError?.(validationError);
      toast.error('Validation Error', {
        description: validationError,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Fetch headliner name for event title
      const { data: headliner, error: headlinerError } = await supabase
        .from('artists' as any)
        .select('name')
        .eq('id', state.headlinerId)
        .single();

      if (headlinerError) {
        logger.error('Error fetching headliner:', headlinerError);
      }

      // Fetch venue name for event title
      const { data: venue, error: venueError } = await supabase
        .from('venues' as any)
        .select('name')
        .eq('id', state.venueId)
        .single();

      if (venueError) {
        logger.error('Error fetching venue:', venueError);
      }

      // Construct event title
      const eventTitle =
        (headliner as any) && (venue as any)
          ? `${(headliner as any).name} @ ${(venue as any).name}`
          : (headliner as any)
            ? (headliner as any).name
            : mode === 'create'
              ? 'New Event'
              : 'Updated Event';

      // Format the date and time for the database
      const eventDateString = state.eventDate ? format(state.eventDate, 'yyyy-MM-dd') : null;
      const eventTimeString = state.eventDate ? format(state.eventDate, 'HH:mm') : null;

      // Prepare event data
      const eventData = {
        title: eventTitle,
        headliner_id: state.headlinerId || null,
        venue_id: state.venueId || null,
        date: eventDateString,
        time: eventTimeString,
        end_time: state.isAfterHours ? null : state.endTime,
        is_after_hours: state.isAfterHours,
        undercard_ids: state.undercardArtists.map(a => a.artistId).filter(Boolean),
        hero_image: state.heroImage || null,
      };

      let resultEventId: string;

      if (mode === 'create') {
        // Create new event
        const { data: newEvent, error: eventError } = await supabase
          .from('events' as any)
          .insert(eventData)
          .select()
          .single();

        if (eventError) throw eventError;
        resultEventId = (newEvent as any).id;

        // Create ticket tiers
        await createTicketTiers(resultEventId, state.ticketTiers);

        toast.success('Event Created', {
          description: `${eventTitle} has been successfully created!`,
        });
      } else {
        // Update existing event
        if (!eventId) throw new Error('Event ID is required for update');

        const { data: updatedEvent, error: eventError } = await supabase
          .from('events' as any)
          .update(eventData)
          .eq('id', eventId)
          .select()
          .single();

        if (eventError) throw eventError;
        resultEventId = eventId;

        // Update ticket tiers
        await updateTicketTiers(eventId, state.ticketTiers);

        toast.success('Event Updated', {
          description: `${eventTitle} has been successfully updated!`,
        });
      }

      setIsLoading(false);
      onSuccess?.(resultEventId);
    } catch (error) {
      logger.error(`Error ${mode === 'create' ? 'creating' : 'updating'} event:`, error);
      setIsLoading(false);
      const err = error instanceof Error ? error : new Error('An unexpected error occurred');
      onError?.(err);
      toast.error(`Failed to ${mode === 'create' ? 'create' : 'update'} event`, {
        description: err.message,
      });
      throw error; // Re-throw to allow caller to handle
    }
  };

  return {
    submitEvent,
    isLoading,
  };
}

// Helper functions

async function createTicketTiers(
  eventId: string,
  ticketTiers: EventFormState['ticketTiers']
) {
  if (ticketTiers.length === 0) return;

  const tiersToInsert = ticketTiers.map((tier, index) => ({
    event_id: eventId,
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

  const { error } = await supabase.from('ticket_tiers' as any).insert(tiersToInsert);

  if (error) throw error;
}

async function updateTicketTiers(
  eventId: string,
  ticketTiers: EventFormState['ticketTiers']
) {
  // Delete existing ticket tiers
  const { error: deleteError } = await supabase
    .from('ticket_tiers' as any)
    .delete()
    .eq('event_id', eventId);

  if (deleteError) throw deleteError;

  // Insert updated ticket tiers
  await createTicketTiers(eventId, ticketTiers);
}
