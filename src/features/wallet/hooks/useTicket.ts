/**
 * Hook for fetching a single ticket by ID
 */

import { useQuery } from '@tanstack/react-query';
import { ticketService } from '../services/ticketService';
import type { TicketWithDetails } from '../types';

export const useTicket = (ticketId: string | undefined) => {
  return useQuery<TicketWithDetails | null, Error>({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      return ticketService.getTicketById(ticketId);
    },
    enabled: !!ticketId,
  });
};
