import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { logger } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';

/**
 * Query key for user staffed events
 */
export const userStaffedEventsKeys = {
  all: ['user-staffed-events'] as const,
  user: (userId: string) => [...userStaffedEventsKeys.all, userId] as const,
};

/**
 * Hook to get all event IDs where the current user is staff
 *
 * This checks both:
 * 1. Direct staff assignments (user_id in event_staff)
 * 2. Organization-based staff (user is member of an org that is event staff)
 *
 * Used for showing invisible/draft events to authorized staff in search results
 */
export function useUserStaffedEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: userStaffedEventsKeys.user(user?.id ?? ''),
    queryFn: async (): Promise<Set<string>> => {
      if (!user?.id) return new Set();

      try {
        // Get events where user is directly assigned as staff
        const { data: directStaff, error: directError } = await supabase
          .from('event_staff')
          .select('event_id')
          .eq('user_id', user.id);

        if (directError) {
          logger.error('Error fetching direct staff events', {
            error: directError.message,
            source: 'useUserStaffedEvents',
          });
        }

        // Get user's organization memberships
        const { data: orgMemberships, error: orgError } = await supabase
          .from('organization_staff')
          .select('organization_id')
          .eq('user_id', user.id);

        if (orgError) {
          logger.error('Error fetching organization memberships', {
            error: orgError.message,
            source: 'useUserStaffedEvents',
          });
        }

        // Get events where user's organizations are staff
        const orgIds = (orgMemberships || []).map((m) => m.organization_id);
        let orgStaffEvents: { event_id: string }[] = [];

        if (orgIds.length > 0) {
          const { data: orgStaff, error: orgStaffError } = await supabase
            .from('event_staff')
            .select('event_id')
            .in('organization_id', orgIds);

          if (orgStaffError) {
            logger.error('Error fetching org staff events', {
              error: orgStaffError.message,
              source: 'useUserStaffedEvents',
            });
          }

          orgStaffEvents = orgStaff || [];
        }

        // Also check if user owns any organizations that are event staff
        const { data: ownedOrgs, error: ownedError } = await supabase
          .from('organizations')
          .select('id')
          .eq('owner_id', user.id);

        if (ownedError) {
          logger.error('Error fetching owned organizations', {
            error: ownedError.message,
            source: 'useUserStaffedEvents',
          });
        }

        const ownedOrgIds = (ownedOrgs || []).map((o) => o.id);
        let ownedOrgStaffEvents: { event_id: string }[] = [];

        if (ownedOrgIds.length > 0) {
          const { data: ownedOrgStaff, error: ownedOrgStaffError } = await supabase
            .from('event_staff')
            .select('event_id')
            .in('organization_id', ownedOrgIds);

          if (ownedOrgStaffError) {
            logger.error('Error fetching owned org staff events', {
              error: ownedOrgStaffError.message,
              source: 'useUserStaffedEvents',
            });
          }

          ownedOrgStaffEvents = ownedOrgStaff || [];
        }

        // Combine all event IDs into a Set for O(1) lookup
        const eventIds = new Set<string>();

        (directStaff || []).forEach((s) => eventIds.add(s.event_id));
        orgStaffEvents.forEach((s) => eventIds.add(s.event_id));
        ownedOrgStaffEvents.forEach((s) => eventIds.add(s.event_id));

        return eventIds;
      } catch (error) {
        logger.error('Error in useUserStaffedEvents', {
          error: error instanceof Error ? error.message : 'Unknown',
          source: 'useUserStaffedEvents',
        });
        return new Set();
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
