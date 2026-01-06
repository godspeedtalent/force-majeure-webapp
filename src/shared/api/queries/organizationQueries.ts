import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Organization } from '@/types/organization';

/**
 * Organization Queries
 *
 * Centralized React Query hooks for organization data operations.
 */

// ============================================================================
// Types
// ============================================================================

export interface EventPartner {
  id: string;
  organization_id: string;
  display_order: number;
  organization: Organization;
}

// ============================================================================
// Query Keys
// ============================================================================

export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
  eventPartners: (eventId: string) => ['event-partners', eventId] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch a single organization by ID
 */
export function useOrganizationById(
  organizationId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery<Organization | null, Error>({
    queryKey: organizationKeys.detail(organizationId || ''),
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID is required');

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) throw error;
      return data as Organization;
    },
    enabled: Boolean(organizationId) && (options?.enabled ?? true),
  });
}

/**
 * Fetch all organizations
 */
export function useOrganizations() {
  return useQuery<Organization[], Error>({
    queryKey: organizationKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data || []) as Organization[];
    },
  });
}

/**
 * Fetch event partners (organizations associated with an event)
 * Note: Uses type assertion because event_partners table may not be in generated types yet
 */
export function useEventPartners(eventId: string | undefined) {
  return useQuery<EventPartner[], Error>({
    queryKey: organizationKeys.eventPartners(eventId || ''),
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required');

      // Use type assertion for table that may not be in generated types yet
      const { data, error } = await (supabase as any)
        .from('event_partners')
        .select(`
          id,
          organization_id,
          display_order,
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
        .order('display_order');

      if (error) {
        // If table doesn't exist yet, return empty array
        if (error.code === '42P01') {
          return [];
        }
        throw error;
      }

      // Transform the data to match our interface
      return (data || []).map((item: any) => ({
        id: item.id,
        organization_id: item.organization_id,
        display_order: item.display_order,
        organization: item.organization,
      }));
    },
    enabled: Boolean(eventId),
  });
}
