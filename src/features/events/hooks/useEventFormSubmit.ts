import { useState } from 'react';
import { logger } from '@/shared/services/logger';
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
        .from('artists')
        .select('name')
        .eq('id', state.headlinerId)
        .single();

      if (headlinerError) {
        logger.error('Error fetching headliner:', {
          error: headlinerError, // Pass full error object
          headlinerId: state.headlinerId,
          source: 'useEventFormSubmit.submitEvent',
          mode,
        });
      }

      // Fetch venue name for event title
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .select('name')
        .eq('id', state.venueId)
        .single();

      if (venueError) {
        logger.error('Error fetching venue:', {
          error: venueError, // Pass full error object
          venueId: state.venueId,
          source: 'useEventFormSubmit.submitEvent',
          mode,
        });
      }

      // Construct event title
      const eventTitle =
        headliner && venue
          ? `${headliner.name} @ ${venue.name}`
          : headliner
            ? headliner.name
            : mode === 'create'
              ? 'New Event'
              : 'Updated Event';

      // Format the date and time for the database as ISO timestamp (TIMESTAMPTZ)
      const startTimeISO = state.eventDate ? state.eventDate.toISOString() : null;

      // Calculate end time as ISO timestamp
      // If end_time is provided (e.g., "02:00"), combine with event date
      let endTimeISO: string | null = null;
      if (!state.isAfterHours && state.endTime && state.eventDate) {
        const [hours, minutes] = state.endTime.split(':');
        const endDate = new Date(state.eventDate);
        endDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        endTimeISO = endDate.toISOString();
      }

      // Prepare event data matching database schema
      const eventData = {
        title: eventTitle,
        description: null,
        headliner_id: state.headlinerId || null,
        venue_id: state.venueId || null,
        start_time: startTimeISO,
        end_time: state.isAfterHours ? null : endTimeISO,
        is_after_hours: state.isAfterHours,
        is_tba: state.isTba,
        test_data: false,
      } as const;

      let resultEventId: string;

      if (mode === 'create') {
        // Create new event
        const { data: newEvent, error: eventError } = await supabase
          .from('events')
          .insert([eventData as any])
          .select()
          .single();

        if (eventError) throw eventError;
        if (!newEvent) throw new Error('Failed to create event - no data returned');
        resultEventId = newEvent.id;

        // Create ticket tiers
        await createTicketTiers(resultEventId, state.ticketTiers);

        toast.success('Event Created', {
          description: `${eventTitle} has been successfully created!`,
        });
      } else {
        // Update existing event
        if (!eventId) throw new Error('Event ID is required for update');

        const { error: eventError } = await supabase
          .from('events')
          .update(eventData as any)
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
      // Enhanced error logging with full details
      // The logger will now properly serialize the error object
      const errorDetails = {
        source: 'useEventFormSubmit.submitEvent',
        mode,
        formState: {
          headlinerId: state.headlinerId,
          venueId: state.venueId,
          eventDate: state.eventDate?.toISOString(),
          isTba: state.isTba,
          isAfterHours: state.isAfterHours,
        },
        error, // Pass the full error object - logger will serialize it
      };

      logger.error(`Error ${mode === 'create' ? 'creating' : 'updating'} event:`, errorDetails);

      setIsLoading(false);
      const err = error instanceof Error ? error : new Error('An unexpected error occurred');
      onError?.(err);

      // Show more helpful error message to user
      const userMessage = (error as { hint?: string })?.hint || (error as { details?: string })?.details || err.message;
      toast.error(`Failed to ${mode === 'create' ? 'create' : 'update'} event`, {
        description: userMessage,
        duration: 8000, // Show longer for error messages
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

  const { error } = await supabase.from('ticket_tiers').insert(tiersToInsert);

  if (error) throw error;
}

async function updateTicketTiers(
  eventId: string,
  ticketTiers: EventFormState['ticketTiers']
) {
  // Fetch existing ticket tiers to check which ones have orders
  const { data: existingTiers, error: fetchError } = await supabase
    .from('ticket_tiers')
    .select('id')
    .eq('event_id', eventId);

  if (fetchError) throw fetchError;

  if (existingTiers && existingTiers.length > 0) {
    // For each existing tier, check if it has orders
    const tierIds = existingTiers.map(t => t.id);

    const { data: ordersData, error: ordersError } = await supabase
      .from('order_items')
      .select('ticket_tier_id')
      .in('ticket_tier_id', tierIds);

    if (ordersError) throw ordersError;

    // Get set of tier IDs that have orders
    const tiersWithOrders = new Set(
      ordersData?.map(item => item.ticket_tier_id) || []
    );

    // Only delete tiers that don't have orders
    const tiersToDelete = existingTiers
      .filter(tier => !tiersWithOrders.has(tier.id))
      .map(tier => tier.id);

    if (tiersToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('ticket_tiers')
        .delete()
        .in('id', tiersToDelete);

      if (deleteError) throw deleteError;
    }
  }

  // Insert new ticket tiers (those without an id)
  const newTiers = ticketTiers.filter((tier) => !tier.id);
  if (newTiers.length > 0) {
    await createTicketTiers(eventId, newTiers);
  }

  // Update existing ticket tiers (those with an id)
  const existingTiersToUpdate = ticketTiers.filter((tier) => tier.id);
  for (const tier of existingTiersToUpdate) {
    const tierId = tier.id;
    if (!tierId) continue;
    
    const { error: updateError } = await supabase
      .from('ticket_tiers')
      .update({
        name: tier.name,
        description: tier.description || null,
        price_cents: tier.priceInCents,
        total_tickets: tier.quantity,
        hide_until_previous_sold_out: tier.hideUntilPreviousSoldOut,
      })
      .eq('id', tierId);

    if (updateError) throw updateError;
  }
}
