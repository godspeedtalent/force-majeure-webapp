import { EventFormState, TicketTier } from './useEventFormState';

/**
 * useEventFormValidation
 *
 * Shared validation logic for event forms.
 * Eliminates duplicate validation code between FmCreateEventButton and FmEditEventButton.
 */
export function useEventFormValidation() {
  const validateForm = (state: EventFormState): string | null => {
    const { headlinerId, eventDate, venueId, ticketTiers, venueCapacity } = state;

    // Required fields
    if (!headlinerId) {
      return 'Please select a headliner';
    }
    if (!eventDate) {
      return 'Please select an event date';
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
    if (!tier.name || tier.name.trim() === '') {
      return `Ticket tier ${tierNumber} must have a name`;
    }
    if (tier.priceInCents < 0) {
      return `Ticket tier "${tier.name}" cannot have a negative price`;
    }
    if (tier.quantity <= 0) {
      return `Ticket tier "${tier.name}" must have at least 1 ticket`;
    }
    return null;
  };

  return {
    validateForm,
    validateTicketTier,
  };
}
