import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import type {
  EventStaffWithDetails,
  EventStaffRole,
} from '@/shared/types/eventStaff';

// Query keys for cache management
export const eventStaffKeys = {
  all: ['event-staff'] as const,
  byEvent: (eventId: string) => ['event-staff', eventId] as const,
};

// Helper to access event_staff table (not yet in generated types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventStaffTable = () => (supabase as any).from('event_staff');

/**
 * Hook for managing staff assignments for a specific event
 */
export const useEventStaff = (eventId: string | undefined) => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  // Fetch staff for this event with user/org details
  const {
    data: staff = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: eventStaffKeys.byEvent(eventId || ''),
    queryFn: async (): Promise<EventStaffWithDetails[]> => {
      if (!eventId) return [];

      const { data, error } = await eventStaffTable()
        .select(`
          id,
          event_id,
          user_id,
          organization_id,
          role,
          created_at,
          updated_at,
          profiles:user_id (
            id,
            user_id,
            display_name,
            full_name,
            avatar_url
          ),
          organizations:organization_id (
            id,
            name,
            profile_picture
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as EventStaffWithDetails[];
    },
    enabled: !!eventId,
  });

  // Add a user as staff
  const addUserStaff = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: EventStaffRole }) => {
      if (!eventId) throw new Error('Event ID is required');

      const { data, error } = await eventStaffTable()
        .insert({
          event_id: eventId,
          user_id: userId,
          organization_id: null,
          role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventStaffKeys.byEvent(eventId || '') });
      toast.success(t('staffing.userAdded'));
    },
    onError: (error: unknown) => {
      // Check for unique constraint violation
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        toast.error(t('staffing.alreadyAdded'));
      } else {
        handleError(error, {
          title: t('staffing.addFailed'),
          context: 'useEventStaff.addUserStaff',
        });
      }
    },
  });

  // Add an organization as staff
  const addOrgStaff = useMutation({
    mutationFn: async ({ organizationId, role }: { organizationId: string; role: EventStaffRole }) => {
      if (!eventId) throw new Error('Event ID is required');

      const { data, error } = await eventStaffTable()
        .insert({
          event_id: eventId,
          user_id: null,
          organization_id: organizationId,
          role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventStaffKeys.byEvent(eventId || '') });
      toast.success(t('staffing.orgAdded'));
    },
    onError: (error: unknown) => {
      // Check for unique constraint violation
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        toast.error(t('staffing.alreadyAdded'));
      } else {
        handleError(error, {
          title: t('staffing.addFailed'),
          context: 'useEventStaff.addOrgStaff',
        });
      }
    },
  });

  // Update staff role
  const updateStaffRole = useMutation({
    mutationFn: async ({ staffId, role }: { staffId: string; role: EventStaffRole }) => {
      const { data, error } = await eventStaffTable()
        .update({ role })
        .eq('id', staffId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventStaffKeys.byEvent(eventId || '') });
      toast.success(t('staffing.roleUpdated'));
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('staffing.updateFailed'),
        context: 'useEventStaff.updateStaffRole',
      });
    },
  });

  // Remove staff from event
  const removeStaff = useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await eventStaffTable()
        .delete()
        .eq('id', staffId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventStaffKeys.byEvent(eventId || '') });
      toast.success(t('staffing.removed'));
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('staffing.removeFailed'),
        context: 'useEventStaff.removeStaff',
      });
    },
  });

  // Helper to check if a user is already staff
  const isUserStaff = (userId: string): boolean => {
    return staff.some(s => s.user_id === userId);
  };

  // Helper to check if an org is already staff
  const isOrgStaff = (orgId: string): boolean => {
    return staff.some(s => s.organization_id === orgId);
  };

  // Get staff by type
  const userStaff = staff.filter(s => s.user_id !== null);
  const orgStaff = staff.filter(s => s.organization_id !== null);

  // Get staff counts by role
  const managerCount = staff.filter(s => s.role === 'manager').length;
  const staffCount = staff.filter(s => s.role === 'staff').length;

  return {
    // Data
    staff,
    userStaff,
    orgStaff,
    managerCount,
    staffCount,

    // Loading states
    isLoading,
    error,

    // Mutations
    addUserStaff: addUserStaff.mutate,
    addOrgStaff: addOrgStaff.mutate,
    updateStaffRole: updateStaffRole.mutate,
    removeStaff: removeStaff.mutate,

    // Mutation states
    isAddingUser: addUserStaff.isPending,
    isAddingOrg: addOrgStaff.isPending,
    isUpdating: updateStaffRole.isPending,
    isRemoving: removeStaff.isPending,

    // Helpers
    isUserStaff,
    isOrgStaff,
  };
};
