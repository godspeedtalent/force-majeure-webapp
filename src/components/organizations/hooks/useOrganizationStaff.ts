import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import type {
  OrganizationStaffWithDetails,
  OrganizationStaffRole,
} from '@/shared/types/organizationStaff';

// Query keys for cache management
export const organizationStaffKeys = {
  all: ['organization-staff'] as const,
  byOrganization: (organizationId: string) => ['organization-staff', organizationId] as const,
};

// Helper to access organization_staff table (not yet in generated types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const organizationStaffTable = () => (supabase as any).from('organization_staff');

/**
 * Hook for managing staff assignments for a specific organization
 */
export const useOrganizationStaff = (organizationId: string | undefined) => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  // Fetch staff for this organization with user details
  const {
    data: staff = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: organizationStaffKeys.byOrganization(organizationId || ''),
    queryFn: async (): Promise<OrganizationStaffWithDetails[]> => {
      if (!organizationId) return [];

      const { data, error } = await organizationStaffTable()
        .select(`
          id,
          organization_id,
          user_id,
          role,
          created_at,
          updated_at,
          profiles:user_id (
            id,
            user_id,
            display_name,
            full_name,
            avatar_url
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist yet, return empty array
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return [];
        }
        throw error;
      }
      return (data || []) as unknown as OrganizationStaffWithDetails[];
    },
    enabled: !!organizationId,
  });

  // Add a user as staff
  const addStaff = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: OrganizationStaffRole }) => {
      if (!organizationId) throw new Error('Organization ID is required');

      const { data, error } = await organizationStaffTable()
        .insert({
          organization_id: organizationId,
          user_id: userId,
          role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationStaffKeys.byOrganization(organizationId || '') });
      toast.success(t('orgStaff.staffAdded'));
    },
    onError: (error: unknown) => {
      // Check for unique constraint violation
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        toast.error(t('orgStaff.alreadyAdded'));
      } else {
        handleError(error, {
          title: t('orgStaff.addFailed'),
          context: 'useOrganizationStaff.addStaff',
        });
      }
    },
  });

  // Update staff role
  const updateStaffRole = useMutation({
    mutationFn: async ({ staffId, role }: { staffId: string; role: OrganizationStaffRole }) => {
      const { data, error } = await organizationStaffTable()
        .update({ role })
        .eq('id', staffId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationStaffKeys.byOrganization(organizationId || '') });
      toast.success(t('orgStaff.roleUpdated'));
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('orgStaff.updateFailed'),
        context: 'useOrganizationStaff.updateStaffRole',
      });
    },
  });

  // Remove staff from organization
  const removeStaff = useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await organizationStaffTable()
        .delete()
        .eq('id', staffId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationStaffKeys.byOrganization(organizationId || '') });
      toast.success(t('orgStaff.removed'));
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('orgStaff.removeFailed'),
        context: 'useOrganizationStaff.removeStaff',
      });
    },
  });

  // Helper to check if a user is already staff
  const isUserStaff = (userId: string): boolean => {
    return staff.some(s => s.user_id === userId);
  };

  // Get staff by role
  const adminStaff = staff.filter(s => s.role === 'admin');
  const regularStaff = staff.filter(s => s.role === 'staff');

  // Get staff counts by role
  const adminCount = adminStaff.length;
  const staffCount = regularStaff.length;

  return {
    // Data
    staff,
    adminStaff,
    regularStaff,
    adminCount,
    staffCount,

    // Loading states
    isLoading,
    error,

    // Mutations
    addStaff: addStaff.mutate,
    updateStaffRole: updateStaffRole.mutate,
    removeStaff: removeStaff.mutate,

    // Mutation states
    isAdding: addStaff.isPending,
    isUpdating: updateStaffRole.isPending,
    isRemoving: removeStaff.isPending,

    // Helpers
    isUserStaff,
  };
};
