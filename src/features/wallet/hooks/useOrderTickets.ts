/**
 * Hook for fetching tickets by order ID
 */

import { useQuery } from '@tanstack/react-query';
import { ticketService } from '../services/ticketService';
import type { TicketWithDetails } from '../types';

export const useOrderTickets = (orderId: string | undefined) => {
  return useQuery<TicketWithDetails[], Error>({
    queryKey: ['tickets', 'order', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      return ticketService.getTicketsByOrderId(orderId);
    },
    enabled: !!orderId,
  });
};
