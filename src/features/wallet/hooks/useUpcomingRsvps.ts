/**
 * Hook for fetching upcoming RSVPs for the current user
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/services/AuthContext';
import { walletRsvpService } from '../services/walletRsvpService';
import type { RsvpWithDetails } from '../types';

export const useUpcomingRsvps = () => {
  const { user } = useAuth();

  return useQuery<RsvpWithDetails[], Error>({
    queryKey: ['rsvps', 'upcoming', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return walletRsvpService.getUpcomingRsvps(user.id);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
