import { useTranslation } from 'react-i18next';
import { EventFormState, TicketTier } from './useEventFormState';

/**
 * useEventFormValidation
 *
 * Shared validation logic for event forms.
 * Eliminates duplicate validation code between FmCreateEventButton and FmEditEventButton.
 */
export function useEventFormValidation() {
  const { t } = useTranslation('validation');

  const validateForm = (state: EventFormState): string | null => {
    const { title, headlinerId, noHeadliner, eventDate, venueId, ticketTiers, venueCapacity, endTime, isAfterHours } = state;

    // Required fields
    if (!title || title.trim() === '') {
      return t('eventTitleRequired');
    }
    // Headliner is required unless noHeadliner is enabled
    if (!noHeadliner && !headlinerId) {
      return t('headlinerRequired');
    }
    if (!eventDate) {
      return t('eventDateRequired');
    }

    // Start time is required (part of eventDate)
    if (eventDate && (!eventDate.getHours() && eventDate.getHours() !== 0)) {
      return t('startTimeRequired');
    }

    // Either end time or is_after_hours must be set
    if (!isAfterHours && (!endTime || endTime === '')) {
      return t('endTimeOrAfterHoursRequired');
    }

    if (!venueId) {
      return t('venueRequired');
    }
    if (ticketTiers.length === 0) {
      return t('ticketTierRequired');
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
      return t('totalTicketsExceedsCapacity', { totalTickets, venueCapacity });
    }

    return null;
  };

  const validateTicketTier = (tier: TicketTier, tierNumber: number): string | null => {
    // Name is required
    if (!tier.name || tier.name.trim() === '') {
      return t('tierNameRequired', { tierNumber });
    }

    // Price is required (can be 0, but must be set)
    if (tier.priceInCents === undefined || tier.priceInCents === null) {
      return t('tierPriceRequired', { tierName: tier.name });
    }
    if (tier.priceInCents < 0) {
      return t('tierNegativePrice', { tierName: tier.name });
    }

    // Quantity is required and must be at least 1
    if (!tier.quantity || tier.quantity <= 0) {
      return t('tierQuantityRequired', { tierName: tier.name });
    }

    // Description is optional - no validation needed

    return null;
  };

  return {
    validateForm,
    validateTicketTier,
  };
}
