import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { logger } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared';

/**
 * Query key for event access checks
 */
export const eventAccessKeys = {
  all: ['event-access'] as const,
  check: (eventId: string, userId: string) => [...eventAccessKeys.all, eventId, userId] as const,
};

interface EventAccessResult {
  /** Whether the user can manage the event */
  canManage: boolean;
  /** Why the user has access (for debugging/display) */
  reason: 'admin' | 'event_manager' | 'org_owner' | 'no_access';
  /** Whether the access check is still loading */
  isLoading: boolean;
  /** Any error that occurred during the check */
  error: Error | null;
}

/**
 * Hook to check if the current user can manage a specific event
 *
 * A user can manage an event if any of the following are true:
 * 1. User has admin role
 * 2. User is assigned as a manager in the event_staff table for this event
 * 3. User owns the organization that owns the event
 *
 * @param eventId - The ID of the event to check access for
 * @param organizationId - The organization ID from the event (optional, will be fetched if not provided)
 * @returns Object containing canManage boolean and loading/error states
 */
export function useCanManageEvent(
  eventId: string | undefined,
  organizationId?: string | null
): EventAccessResult {
  const { user } = useAuth();
  const { hasRole } = useUserPermissions();

  // Admin check is synchronous - admins can manage any event
  const isAdmin = hasRole(ROLES.ADMIN);

  // Query to check event management access
  const { data, isLoading, error } = useQuery({
    queryKey: eventAccessKeys.check(eventId ?? '', user?.id ?? ''),
    queryFn: async (): Promise<{ canManage: boolean; reason: EventAccessResult['reason'] }> => {
      // If admin, no need to check further
      if (isAdmin) {
        return { canManage: true, reason: 'admin' };
      }

      if (!eventId || !user?.id) {
        return { canManage: false, reason: 'no_access' };
      }

      try {
        // Check if user is directly assigned as a manager for this event
        const { data: directStaffData, error: directError } = await supabase
          .from('event_staff')
          .select('id, role')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .eq('role', 'manager')
          .maybeSingle();

        if (directError && !directError.message?.includes('does not exist')) {
          logger.error('Error checking direct staff assignment', {
            error: directError.message,
            source: 'useCanManageEvent',
          });
        }

        if (directStaffData) {
          return { canManage: true, reason: 'event_manager' };
        }

        // Check if user owns an organization that is assigned as manager
        const { data: ownedOrgs, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('owner_id', user.id);

        if (orgError) {
          logger.error('Error fetching owned organizations', {
            error: orgError.message,
            source: 'useCanManageEvent',
          });
        }

        if (ownedOrgs && ownedOrgs.length > 0) {
          const ownedOrgIds = ownedOrgs.map((o) => o.id);

          // Check if any owned org is a manager for this event
          const { data: orgStaffData, error: orgStaffError } = await supabase
            .from('event_staff')
            .select('id')
            .eq('event_id', eventId)
            .eq('role', 'manager')
            .in('organization_id', ownedOrgIds)
            .limit(1);

          if (orgStaffError && !orgStaffError.message?.includes('does not exist')) {
            logger.error('Error checking org staff assignment', {
              error: orgStaffError.message,
              source: 'useCanManageEvent',
            });
          }

          if (orgStaffData && orgStaffData.length > 0) {
            return { canManage: true, reason: 'event_manager' };
          }
        }

        // Check if user owns the organization that owns the event
        const orgIdToCheck = organizationId;

        if (orgIdToCheck) {
          // Check if user owns this organization
          const { data: orgData, error: ownerError } = await supabase
            .from('organizations')
            .select('id')
            .eq('id', orgIdToCheck)
            .eq('owner_id', user.id)
            .maybeSingle();

          if (ownerError) {
            logger.error('Error checking organization ownership', {
              error: ownerError.message,
              source: 'useCanManageEvent',
            });
          }

          if (orgData) {
            return { canManage: true, reason: 'org_owner' };
          }
        } else {
          // Need to fetch the event to get its organization_id
          const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('organization_id')
            .eq('id', eventId)
            .single();

          if (eventError) {
            logger.error('Error fetching event organization', {
              error: eventError.message,
              source: 'useCanManageEvent',
            });
          }

          if (eventData?.organization_id) {
            const { data: orgData, error: ownerError } = await supabase
              .from('organizations')
              .select('id')
              .eq('id', eventData.organization_id)
              .eq('owner_id', user.id)
              .maybeSingle();

            if (ownerError) {
              logger.error('Error checking organization ownership', {
                error: ownerError.message,
                source: 'useCanManageEvent',
              });
            }

            if (orgData) {
              return { canManage: true, reason: 'org_owner' };
            }
          }
        }

        return { canManage: false, reason: 'no_access' };
      } catch (err) {
        logger.error('Error in useCanManageEvent', {
          error: err instanceof Error ? err.message : 'Unknown',
          source: 'useCanManageEvent',
          eventId,
        });
        return { canManage: false, reason: 'no_access' };
      }
    },
    enabled: !!eventId && (!!user?.id || isAdmin),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // If admin, return immediately without waiting for query
  if (isAdmin) {
    return {
      canManage: true,
      reason: 'admin',
      isLoading: false,
      error: null,
    };
  }

  return {
    canManage: data?.canManage ?? false,
    reason: data?.reason ?? 'no_access',
    isLoading,
    error: error as Error | null,
  };
}
