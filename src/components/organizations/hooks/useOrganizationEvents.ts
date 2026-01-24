import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { logger } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export type OrganizationEventRelationship = 'organizer' | 'partner';

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
  /** Indicates if the org is the organizer or a partner/sponsor */
  relationship: OrganizationEventRelationship;
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
 * Fetch all events for an organization (both as organizer and as partner/sponsor)
 */
async function fetchOrganizationEvents(
  organizationId: string
): Promise<OrganizationEvent[]> {
  // Fetch events where organization is the direct organizer
  const { data: organizerEvents, error: organizerError } = await supabase
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

  if (organizerError) {
    logger.error('Failed to fetch organizer events', {
      error: organizerError.message,
      source: 'useOrganizationEvents.fetchOrganizationEvents',
      organizationId,
    });
    throw organizerError;
  }

  // Fetch events where organization is a partner/sponsor
  const { data: partnerEventIds, error: partnerIdsError } = await supabase
    .from('event_partners')
    .select('event_id')
    .eq('organization_id', organizationId);

  if (partnerIdsError) {
    logger.error('Failed to fetch partner event IDs', {
      error: partnerIdsError.message,
      source: 'useOrganizationEvents.fetchOrganizationEvents',
      organizationId,
    });
    throw partnerIdsError;
  }

  // Fetch partner event details if there are any
  let partnerEvents: typeof organizerEvents = [];
  const partnerIds = (partnerEventIds || []).map((p) => p.event_id);

  if (partnerIds.length > 0) {
    const { data: partnerEventsData, error: partnerEventsError } = await supabase
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
      .in('id', partnerIds)
      .order('start_time', { ascending: false });

    if (partnerEventsError) {
      logger.error('Failed to fetch partner events', {
        error: partnerEventsError.message,
        source: 'useOrganizationEvents.fetchOrganizationEvents',
        organizationId,
      });
      throw partnerEventsError;
    }

    partnerEvents = partnerEventsData || [];
  }

  // Create a set of organizer event IDs for deduplication
  const organizerEventIds = new Set((organizerEvents || []).map((e) => e.id));

  // Map organizer events with relationship type
  const organizerEventsWithRelation: OrganizationEvent[] = (organizerEvents || []).map(
    (event) => ({
      ...event,
      relationship: 'organizer' as const,
    })
  ) as OrganizationEvent[];

  // Map partner events with relationship type (excluding duplicates)
  const partnerEventsWithRelation: OrganizationEvent[] = (partnerEvents || [])
    .filter((event) => !organizerEventIds.has(event.id))
    .map((event) => ({
      ...event,
      relationship: 'partner' as const,
    })) as OrganizationEvent[];

  // Combine and sort by start_time descending
  const allEvents = [...organizerEventsWithRelation, ...partnerEventsWithRelation].sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );

  return allEvents;
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
