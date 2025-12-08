import { EventFormState, TicketTier } from './useEventFormState';

/**
 * useEventFormValidation
 *
 * Shared validation logic for event forms.
 * Eliminates duplicate validation code between FmCreateEventButton and FmEditEventButton.
 */
export function useEventFormValidation() {
  const validateForm = (state: EventFormState): string | null => {
    const { title, headlinerId, eventDate, venueId, ticketTiers, venueCapacity, endTime, isAfterHours } = state;

    // Required fields
    if (!title || title.trim() === '') {
      return 'Please provide an event title';
    }
    if (!headlinerId) {
      return 'Please select a headliner';
    }
    if (!eventDate) {
      return 'Please select an event date';
    }

    // Start time is required (part of eventDate)
    if (eventDate && (!eventDate.getHours() && eventDate.getHours() !== 0)) {
      return 'Please select a start time';
    }

    // Either end time or is_after_hours must be set
    if (!isAfterHours && (!endTime || endTime === '')) {
      return 'Please select an end time or mark as after hours event';
    }

    if (!venueId) {
      return 'Please select a venue';
    }
    if (ticketTiers.length === 0) {
      return 'Please add at least one ticket tier';
    }

    // Validate individual ticket tiers
    for (let i = 0; i < ticketTiers.length; i++) {
      const tier = ticketTiers[i];
      const tierError = validateTicketTier(tier, i + 1);
      if (tierError) {
        return tierError;
      }
    }

    // Validate total capacity
    const totalTickets = ticketTiers.reduce((sum, tier) => sum + tier.quantity, 0);
    if (totalTickets > venueCapacity) {
      return `Total tickets (${totalTickets}) exceeds venue capacity (${venueCapacity})`;
    }

    return null;
  };

  const validateTicketTier = (tier: TicketTier, tierNumber: number): string | null => {
    // Name is required
    if (!tier.name || tier.name.trim() === '') {
      return `Ticket tier ${tierNumber} must have a name`;
    }

    // Price is required (can be 0, but must be set)
    if (tier.priceInCents === undefined || tier.priceInCents === null) {
      return `Ticket tier "${tier.name}" must have a price (use 0 for free)`;
    }
    if (tier.priceInCents < 0) {
      return `Ticket tier "${tier.name}" cannot have a negative price`;
    }

    // Quantity is required and must be at least 1
    if (!tier.quantity || tier.quantity <= 0) {
      return `Ticket tier "${tier.name}" must have at least 1 ticket`;
    }

    // Description is optional - no validation needed

    return null;
  };

  return {
    validateForm,
    validateTicketTier,
  };
}
