import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
import type { StaffTabCounts } from '../types';

/**
 * Staff Counts Hook
 *
 * Fetches badge counts for staff navigation items.
 * - Pending user requests
 * - Pending artist registrations
 */
export function useStaffCounts(): StaffTabCounts {
  // Pending user requests count
  const { data: pendingRequests = 0 } = useQuery({
    queryKey: ['user-requests-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Pending artist registrations count
  const { data: pendingRegistrations = 0 } = useQuery({
    queryKey: ['artist-registrations-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('artist_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
  });

  return {
    pendingRequests,
    pendingRegistrations,
  };
}
