/**
 * Hook for fetching upcoming tickets for the current user
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/services/AuthContext';
import { ticketService } from '../services/ticketService';
import type { TicketWithDetails } from '../types';

export const useUpcomingTickets = () => {
  const { user } = useAuth();

  return useQuery<TicketWithDetails[], Error>({
    queryKey: ['tickets', 'upcoming', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return ticketService.getUpcomingTickets(user.id);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
