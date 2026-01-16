/**
 * useEntityNames Hook
 *
 * Fetches entity names for resource IDs found in page paths.
 * Used to display human-readable names in analytics (e.g., "Ninajirachi" instead of UUID).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EntityNameMap {
  [id: string]: string;
}

interface UseEntityNamesResult {
  getEntityName: (id: string) => string | null;
  formatPagePath: (path: string) => string;
  isLoading: boolean;
}

/**
 * Extract all UUIDs from an array of page paths
 */
function extractUuidsFromPaths(paths: string[]): Set<string> {
  const uuids = new Set<string>();
  const uuidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi;

  paths.forEach(path => {
    const matches = path.match(uuidPattern);
    if (matches) {
      matches.forEach(uuid => uuids.add(uuid.toLowerCase()));
    }
  });

  return uuids;
}

/**
 * Hook for resolving entity names from UUIDs in page paths
 */
export function useEntityNames(pagePaths: string[]): UseEntityNamesResult {
  const uuids = Array.from(extractUuidsFromPaths(pagePaths));

  const { data: entityMap = {}, isLoading } = useQuery({
    queryKey: ['entity-names', uuids.sort().join(',')],
    queryFn: async (): Promise<EntityNameMap> => {
      if (uuids.length === 0) return {};

      const map: EntityNameMap = {};

      // Fetch artists
      const { data: artists } = await supabase
        .from('artists')
        .select('id, name')
        .in('id', uuids);

      artists?.forEach(a => {
        map[a.id] = a.name;
      });

      // Fetch events
      const { data: events } = await supabase
        .from('events')
        .select('id, title')
        .in('id', uuids);

      events?.forEach(e => {
        map[e.id] = e.title;
      });

      // Fetch venues
      const { data: venues } = await supabase
        .from('venues')
        .select('id, name')
        .in('id', uuids);

      venues?.forEach(v => {
        map[v.id] = v.name;
      });

      // Fetch profiles (users)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, username')
        .in('id', uuids);

      profiles?.forEach(p => {
        map[p.id] = p.display_name || p.username || 'User';
      });

      // Fetch organizations
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', uuids);

      orgs?.forEach(o => {
        map[o.id] = o.name;
      });

      return map;
    },
    enabled: uuids.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const getEntityName = (id: string): string | null => {
    return entityMap[id.toLowerCase()] || null;
  };

  const formatPagePath = (path: string): string => {
    // Replace UUIDs with entity names where available
    return path.replace(
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
      (uuid) => {
        const name = entityMap[uuid.toLowerCase()];
        return name ? `[${name}]` : uuid;
      }
    );
  };

  return { getEntityName, formatPagePath, isLoading };
}
