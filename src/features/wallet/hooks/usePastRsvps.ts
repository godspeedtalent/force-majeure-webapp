/**
 * Hook for fetching past RSVPs for the current user
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/services/AuthContext';
import { walletRsvpService } from '../services/walletRsvpService';
import type { RsvpWithDetails } from '../types';

export const usePastRsvps = () => {
  const { user } = useAuth();

  return useQuery<RsvpWithDetails[], Error>({
    queryKey: ['rsvps', 'past', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return walletRsvpService.getPastRsvps(user.id);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
