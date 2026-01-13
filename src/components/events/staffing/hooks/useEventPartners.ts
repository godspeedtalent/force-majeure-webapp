import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import type { Organization } from '@/types/organization';

// ============================================================================
// Types
// ============================================================================

export interface EventPartner {
  id: string;
  event_id: string;
  organization_id: string;
  display_order: number;
  is_hidden: boolean;
  created_at: string;
  organization?: Organization;
}

export interface EventPartnerWithOrg extends EventPartner {
  organization: Organization;
}

// ============================================================================
// Query Keys
// ============================================================================

export const eventPartnerKeys = {
  all: ['event-partners'] as const,
  byEvent: (eventId: string) => ['event-partners', eventId] as const,
};

// Helper to access event_partners table (not yet in generated types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const eventPartnersTable = () => (supabase as any).from('event_partners');

/**
 * Hook for managing partner organizations for a specific event
 * Partners are organizations linked to the event (sponsors, co-promoters, etc.)
 */
export const useEventPartners = (eventId: string | undefined) => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  // Fetch partners for this event with organization details
  const {
    data: partners = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: eventPartnerKeys.byEvent(eventId || ''),
    queryFn: async (): Promise<EventPartnerWithOrg[]> => {
      if (!eventId) return [];

      const { data, error } = await eventPartnersTable()
        .select(`
          id,
          event_id,
          organization_id,
          display_order,
          is_hidden,
          created_at,
          organization:organizations (
            id,
            name,
            profile_picture,
            owner_id,
            created_at,
            updated_at
          )
        `)
        .eq('event_id', eventId)
        .order('display_order', { ascending: true });

      if (error) {
        // If table doesn't exist yet, return empty array
        if (error.code === '42P01') {
          return [];
        }
        throw error;
      }

      return (data || []) as unknown as EventPartnerWithOrg[];
    },
    enabled: !!eventId,
  });

  // Add an organization as a partner
  const addPartner = useMutation({
    mutationFn: async ({ organizationId }: { organizationId: string }) => {
      if (!eventId) throw new Error('Event ID is required');

      // Get the next display order
      const maxOrder = partners.length > 0
        ? Math.max(...partners.map(p => p.display_order))
        : -1;

      const { data, error } = await eventPartnersTable()
        .insert({
          event_id: eventId,
          organization_id: organizationId,
          display_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventPartnerKeys.byEvent(eventId || '') });
      toast.success(t('partners.partnerAdded'));
    },
    onError: (error: unknown) => {
      // Check for unique constraint violation
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        toast.error(t('partners.alreadyPartner'));
      } else {
        handleError(error, {
          title: t('partners.addFailed'),
          context: 'useEventPartners.addPartner',
        });
      }
    },
  });

  // Remove a partner from the event
  const removePartner = useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await eventPartnersTable()
        .delete()
        .eq('id', partnerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventPartnerKeys.byEvent(eventId || '') });
      toast.success(t('partners.partnerRemoved'));
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('partners.removeFailed'),
        context: 'useEventPartners.removePartner',
      });
    },
  });

  // Reorder partners
  const reorderPartners = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      if (!eventId) throw new Error('Event ID is required');

      // Update each partner's display_order
      const updates = orderedIds.map((id, index) =>
        eventPartnersTable()
          .update({ display_order: index })
          .eq('id', id)
      );

      const results = await Promise.all(updates);

      // Check for errors
      const errorResult = results.find(r => r.error);
      if (errorResult?.error) throw errorResult.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventPartnerKeys.byEvent(eventId || '') });
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('partners.reorderFailed'),
        context: 'useEventPartners.reorderPartners',
      });
    },
  });

  // Toggle visibility of a partner (hide/show on event page)
  const togglePartnerVisibility = useMutation({
    mutationFn: async ({ partnerId, isHidden }: { partnerId: string; isHidden: boolean }) => {
      const { error } = await eventPartnersTable()
        .update({ is_hidden: isHidden })
        .eq('id', partnerId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: eventPartnerKeys.byEvent(eventId || '') });
      toast.success(
        variables.isHidden
          ? t('partners.partnerHidden')
          : t('partners.partnerVisible')
      );
    },
    onError: (error: unknown) => {
      handleError(error, {
        title: t('partners.visibilityFailed'),
        context: 'useEventPartners.togglePartnerVisibility',
      });
    },
  });

  // Helper to check if an org is already a partner
  const isPartner = (orgId: string): boolean => {
    return partners.some(p => p.organization_id === orgId);
  };

  return {
    // Data
    partners,

    // Loading states
    isLoading,
    error,

    // Mutations
    addPartner: addPartner.mutate,
    removePartner: removePartner.mutate,
    reorderPartners: reorderPartners.mutate,
    togglePartnerVisibility: togglePartnerVisibility.mutate,

    // Mutation states
    isAdding: addPartner.isPending,
    isRemoving: removePartner.isPending,
    isReordering: reorderPartners.isPending,
    isTogglingVisibility: togglePartnerVisibility.isPending,

    // Helpers
    isPartner,
  };
};