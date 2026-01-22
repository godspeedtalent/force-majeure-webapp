import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { logger } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export interface OrganizationEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  status: string;
  hero_image: string | null;
  organization_id: string | null;
  venue: {
    id: string;
    name: string;
  } | null;
  headliner: {
    id: string;
    name: string;
  } | null;
}

export interface UseOrganizationEventsOptions {
  enabled?: boolean;
}

/**
 * Query key factory for organization events
 */
export const organizationEventsKeys = {
  all: ['organization-events'] as const,
  list: (organizationId: string) =>
    [...organizationEventsKeys.all, 'list', organizationId] as const,
};

/**
 * Fetch all events for an organization
 */
async function fetchOrganizationEvents(
  organizationId: string
): Promise<OrganizationEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      title,
      start_time,
      end_time,
      status,
      hero_image,
      organization_id,
      venue:venues!events_venue_id_fkey(id, name),
      headliner:artists!events_headliner_id_fkey(id, name)
    `
    )
    .eq('organization_id', organizationId)
    .order('start_time', { ascending: false });

  if (error) {
    logger.error('Failed to fetch organization events', {
      error: error.message,
      source: 'useOrganizationEvents.fetchOrganizationEvents',
      organizationId,
    });
    throw error;
  }

  return (data || []) as unknown as OrganizationEvent[];
}

/**
 * Hook to fetch events belonging to an organization
 */
export function useOrganizationEvents(
  organizationId: string | undefined,
  options?: UseOrganizationEventsOptions
) {
  return useQuery({
    queryKey: organizationEventsKeys.list(organizationId || ''),
    queryFn: () => fetchOrganizationEvents(organizationId!),
    enabled: Boolean(organizationId) && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to unlink an event from an organization
 */
export function useUnlinkEventFromOrganization() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('toasts');

  return useMutation({
    mutationFn: async ({
      eventId,
      organizationId,
    }: {
      eventId: string;
      organizationId: string;
    }) => {
      const { error } = await supabase
        .from('events')
        .update({ organization_id: null })
        .eq('id', eventId);

      if (error) throw error;
      return { eventId, organizationId };
    },
    onSuccess: ({ organizationId }) => {
      toast.success(t('organizations.eventUnlinked'));
      queryClient.invalidateQueries({
        queryKey: organizationEventsKeys.list(organizationId),
      });
    },
    onError: (error) => {
      handleError(error, {
        title: t('organizations.eventUnlinkFailed'),
        context: 'useUnlinkEventFromOrganization',
      });
    },
  });
}
