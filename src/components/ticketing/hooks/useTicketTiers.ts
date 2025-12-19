import { useQuery } from '@tanstack/react-query';

import { ticketTierService } from '@/features/ticketing/services/ticketTierService';
import type { TicketTier } from '@/features/events/types';

export const useTicketTiers = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['ticket-tiers', eventId],
    queryFn: async (): Promise<TicketTier[]> => {
      if (!eventId) return [];
      return ticketTierService.getActiveTiersByEventId(eventId);
    },
    enabled: !!eventId,
  });
};
