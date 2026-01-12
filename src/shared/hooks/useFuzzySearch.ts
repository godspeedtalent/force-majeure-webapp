/**
 * useFuzzySearch Hook
 *
 * Provides a unified fuzzy search experience combining PostgreSQL pg_trgm
 * with Fuse.js client-side re-ranking.
 *
 * Features:
 * - Debounced queries to reduce database load
 * - Automatic fallback to ILIKE when pg_trgm unavailable
 * - Combined ranking from DB similarity + Fuse.js scores
 * - Loading and error states
 *
 * @example
 * ```tsx
 * const { results, isLoading, error } = useFuzzySearch({
 *   query: searchQuery,
 *   tables: ['artists', 'events', 'venues'],
 *   limit: 10,
 * });
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/services/logger';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  reRankWithFuse,
  type FuzzySearchResult,
  type FuzzySearchOptions,
  type SearchableItem,
} from '@/shared/utils/fuzzySearch';

/**
 * TEMPORARY WORKAROUND: RPC Type Casting
 *
 * These type assertions are necessary because the pg_trgm fuzzy search functions
 * (search_artists_fuzzy, search_events_fuzzy, search_venues_fuzzy, search_profiles_fuzzy,
 * is_pg_trgm_available) are defined in migration 20260106000000_add_pg_trgm_fuzzy_search.sql
 * but may not yet be in the generated Supabase types.
 *
 * TODO: Remove these casts after running `supabase gen types typescript` once migrations
 * have been applied and types regenerated. At that point, supabase.rpc() will have
 * proper type definitions for these functions.
 */
type RpcCall = (fn: string, args?: object) => Promise<{ data: unknown; error: unknown }>;
const rpc = supabase.rpc as unknown as RpcCall;

// ============================================================================
// Types
// ============================================================================

export type SearchableTable =
  | 'artists'
  | 'events'
  | 'venues'
  | 'profiles'
  | 'organizations';

export interface FuzzySearchConfig {
  /** Search query string */
  query: string;
  /** Tables to search */
  tables: SearchableTable[];
  /** Minimum similarity threshold (0-1, default: 0.3) */
  threshold?: number;
  /** Maximum results per table */
  limit?: number;
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Minimum query length to trigger search (default: 2) */
  minQueryLength?: number;
  /** For events: only return upcoming events */
  upcomingEventsOnly?: boolean;
  /** Enable/disable the search (useful for conditional searching) */
  enabled?: boolean;
}

export interface ArtistSearchResult extends SearchableItem {
  id: string;
  name: string;
  bio?: string | null;
  image_url?: string | null;
}

export interface EventSearchResult extends SearchableItem {
  id: string;
  title: string;
  description?: string | null;
  start_time?: string | null;
  hero_image?: string | null;
  venue_id?: string | null;
  headliner_name?: string | null;
}

/** Raw result shape from events query with headliner join */
interface EventQueryResult {
  id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  hero_image: string | null;
  venue_id: string | null;
  headliner: { name: string } | null;
  headliner_id?: string | null;
}

export interface VenueSearchResult extends SearchableItem {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  image_url?: string | null;
}

export interface ProfileSearchResult extends SearchableItem {
  id: string;
  user_id: string;
  display_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface OrganizationSearchResult extends SearchableItem {
  id: string;
  name: string;
  logo_url?: string | null;
}

export interface FuzzySearchResults {
  artists: FuzzySearchResult<ArtistSearchResult>[];
  events: FuzzySearchResult<EventSearchResult>[];
  venues: FuzzySearchResult<VenueSearchResult>[];
  profiles: FuzzySearchResult<ProfileSearchResult>[];
  organizations: FuzzySearchResult<OrganizationSearchResult>[];
}

export interface UseFuzzySearchReturn {
  results: FuzzySearchResults;
  isLoading: boolean;
  error: Error | null;
  /** Whether pg_trgm extension is available */
  hasFuzzySupport: boolean;
  /** Refetch search results */
  refetch: () => void;
  /** Clear all results */
  clear: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const EMPTY_RESULTS: FuzzySearchResults = {
  artists: [],
  events: [],
  venues: [],
  profiles: [],
  organizations: [],
};

const DEFAULT_CONFIG = {
  threshold: 0.3,
  limit: 10,
  debounceMs: 300,
  minQueryLength: 2,
  upcomingEventsOnly: false,
  enabled: true,
};

// ============================================================================
// Query Keys
// ============================================================================

export const fuzzySearchKeys = {
  all: ['fuzzy-search'] as const,
  search: (query: string, tables: SearchableTable[]) =>
    [...fuzzySearchKeys.all, query, tables.sort().join(',')] as const,
  trgmAvailable: ['pg-trgm-available'] as const,
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useFuzzySearch(config: FuzzySearchConfig): UseFuzzySearchReturn {
  const {
    query,
    tables,
    threshold = DEFAULT_CONFIG.threshold,
    limit = DEFAULT_CONFIG.limit,
    debounceMs = DEFAULT_CONFIG.debounceMs,
    minQueryLength = DEFAULT_CONFIG.minQueryLength,
    upcomingEventsOnly = DEFAULT_CONFIG.upcomingEventsOnly,
    enabled = DEFAULT_CONFIG.enabled,
  } = config;

  const debouncedQuery = useDebounce(query, debounceMs);
  const [results, setResults] = useState<FuzzySearchResults>(EMPTY_RESULTS);

  // Check if pg_trgm is available
  // Note: The RPC functions are created by the migration and may not be in generated types yet
  const { data: hasFuzzySupport = false } = useQuery({
    queryKey: fuzzySearchKeys.trgmAvailable,
    queryFn: async () => {
      try {
        const { data, error } = await rpc('is_pg_trgm_available');
        if (error) {
          logger.warn('Could not check pg_trgm availability', {
            error: String(error),
          });
          return false;
        }
        return data === true;
      } catch {
        return false;
      }
    },
    staleTime: Infinity, // Only check once per session
    gcTime: Infinity,
  });

  // Main search query
  const searchQuery = useQuery({
    queryKey: fuzzySearchKeys.search(debouncedQuery, tables),
    queryFn: async () => {
      const trimmedQuery = debouncedQuery.trim();
      if (trimmedQuery.length < minQueryLength) {
        return EMPTY_RESULTS;
      }

      const searchResults: FuzzySearchResults = { ...EMPTY_RESULTS };

      // Execute searches in parallel
      const searchPromises: Promise<void>[] = [];

      // Define search configs inline to avoid type mismatches with nullable fields
      const artistConfig: FuzzySearchOptions<ArtistSearchResult> = {
        keys: ['name'],
        threshold: 0.4,
        limit: 10,
      };
      const eventConfig: FuzzySearchOptions<EventSearchResult> = {
        keys: ['title', 'description', 'headliner_name'],
        threshold: 0.4,
        limit: 10,
      };
      const venueConfig: FuzzySearchOptions<VenueSearchResult> = {
        keys: ['name'],
        threshold: 0.4,
        limit: 10,
      };
      const profileConfig: FuzzySearchOptions<ProfileSearchResult> = {
        keys: ['display_name', 'full_name'],
        threshold: 0.4,
        limit: 10,
      };
      const organizationConfig: FuzzySearchOptions<OrganizationSearchResult> = {
        keys: ['name'],
        threshold: 0.4,
        limit: 10,
      };

      if (tables.includes('artists')) {
        searchPromises.push(
          searchArtists(trimmedQuery, threshold, limit, hasFuzzySupport).then(
            data => {
              searchResults.artists = reRankWithFuse(
                data,
                trimmedQuery,
                artistConfig
              );
            }
          )
        );
      }

      if (tables.includes('events')) {
        searchPromises.push(
          searchEvents(
            trimmedQuery,
            threshold,
            limit,
            upcomingEventsOnly,
            hasFuzzySupport
          ).then(data => {
            searchResults.events = reRankWithFuse(
              data,
              trimmedQuery,
              eventConfig
            );
          })
        );
      }

      if (tables.includes('venues')) {
        searchPromises.push(
          searchVenues(trimmedQuery, threshold, limit, hasFuzzySupport).then(
            data => {
              searchResults.venues = reRankWithFuse(
                data,
                trimmedQuery,
                venueConfig
              );
            }
          )
        );
      }

      if (tables.includes('profiles')) {
        searchPromises.push(
          searchProfiles(trimmedQuery, threshold, limit, hasFuzzySupport).then(
            data => {
              searchResults.profiles = reRankWithFuse(
                data,
                trimmedQuery,
                profileConfig
              );
            }
          )
        );
      }

      if (tables.includes('organizations')) {
        searchPromises.push(
          searchOrganizations(
            trimmedQuery,
            threshold,
            limit,
            hasFuzzySupport
          ).then(data => {
            searchResults.organizations = reRankWithFuse(
              data,
              trimmedQuery,
              organizationConfig
            );
          })
        );
      }

      await Promise.all(searchPromises);

      return searchResults;
    },
    enabled: enabled && debouncedQuery.trim().length >= minQueryLength,
  });

  // Update results when query succeeds
  useEffect(() => {
    if (searchQuery.data) {
      setResults(searchQuery.data);
    }
  }, [searchQuery.data]);

  // Clear results when query is cleared
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < minQueryLength) {
      setResults(EMPTY_RESULTS);
    }
  }, [debouncedQuery, minQueryLength]);

  const clear = useCallback(() => {
    setResults(EMPTY_RESULTS);
  }, []);

  return {
    results,
    isLoading: searchQuery.isLoading,
    error: searchQuery.error,
    hasFuzzySupport,
    refetch: searchQuery.refetch,
    clear,
  };
}

// ============================================================================
// Search Functions
// ============================================================================

async function searchArtists(
  query: string,
  threshold: number,
  limit: number,
  useFuzzy: boolean
): Promise<ArtistSearchResult[]> {
  try {
    if (useFuzzy) {
      const { data, error } = await rpc('search_artists_fuzzy', {
        p_query: query,
        p_threshold: threshold,
        p_limit: limit,
      });

      if (error) throw error;
      return (data || []) as ArtistSearchResult[];
    }

    // Fallback to ILIKE
    const { data, error } = await supabase
      .from('artists')
      .select('id, name, bio, image_url')
      .ilike('name', `%${query}%`)
      .limit(limit);

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      similarity_score: 0.5,
    })) as ArtistSearchResult[];
  } catch (error) {
    logger.error('Error searching artists', { error, query });
    return [];
  }
}

async function searchEvents(
  query: string,
  threshold: number,
  limit: number,
  upcomingOnly: boolean,
  useFuzzy: boolean
): Promise<EventSearchResult[]> {
  try {
    if (useFuzzy) {
      const { data, error } = await rpc('search_events_fuzzy', {
        p_query: query,
        p_threshold: threshold,
        p_limit: limit,
        p_upcoming_only: upcomingOnly,
      });

      if (error) throw error;
      return (data || []) as EventSearchResult[];
    }

    // Fallback to ILIKE - search events by title/description and by headliner name
    // PostgREST doesn't support filtering on joined relations in .or(), so we run two queries
    const baseQuery = {
      select: 'id, title, description, start_time, hero_image, venue_id, headliner:artists!headliner_id(name)',
    };

    // Query 1: Search by event title/description
    let titleQueryBuilder = supabase
      .from('events')
      .select(baseQuery.select)
      .eq('status', 'published') // Only published events
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);

    if (upcomingOnly) {
      titleQueryBuilder = titleQueryBuilder.gte('start_time', new Date().toISOString());
    }

    // Query 2: Search by headliner name (get event IDs from events with matching headliner)
    let headlinerQueryBuilder = supabase
      .from('events')
      .select(baseQuery.select + ', headliner_id')
      .eq('status', 'published') // Only published events
      .not('headliner_id', 'is', null)
      .limit(limit * 2); // Get more to filter

    if (upcomingOnly) {
      headlinerQueryBuilder = headlinerQueryBuilder.gte('start_time', new Date().toISOString());
    }

    const [titleResult, headlinerResult] = await Promise.all([
      titleQueryBuilder,
      headlinerQueryBuilder,
    ]);

    if (titleResult.error) throw titleResult.error;
    if (headlinerResult.error) throw headlinerResult.error;

    // Cast results to known type
    const titleData = (titleResult.data || []) as unknown as EventQueryResult[];
    const headlinerData = (headlinerResult.data || []) as unknown as EventQueryResult[];

    // Filter headliner results client-side by artist name match
    const queryLower = query.toLowerCase();
    const headlinerMatches = headlinerData.filter(item => {
      return item.headliner?.name?.toLowerCase().includes(queryLower);
    });

    // Merge results, deduplicating by event ID
    const seenIds = new Set<string>();
    const mergedResults: EventSearchResult[] = [];

    for (const item of [...titleData, ...headlinerMatches]) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        mergedResults.push({
          id: item.id,
          title: item.title,
          description: item.description,
          start_time: item.start_time,
          hero_image: item.hero_image,
          venue_id: item.venue_id,
          headliner_name: item.headliner?.name ?? null,
          similarity_score: 0.5,
        });
      }
    }

    return mergedResults.slice(0, limit);
  } catch (error) {
    logger.error('Error searching events', { error, query });
    return [];
  }
}

async function searchVenues(
  query: string,
  threshold: number,
  limit: number,
  useFuzzy: boolean
): Promise<VenueSearchResult[]> {
  try {
    if (useFuzzy) {
      const { data, error } = await rpc('search_venues_fuzzy', {
        p_query: query,
        p_threshold: threshold,
        p_limit: limit,
      });

      if (error) throw error;
      return (data || []) as VenueSearchResult[];
    }

    // Fallback to ILIKE
    const { data, error } = await supabase
      .from('venues')
      .select('id, name, city, state, image_url')
      .ilike('name', `%${query}%`)
      .limit(limit);

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      similarity_score: 0.5,
    })) as VenueSearchResult[];
  } catch (error) {
    logger.error('Error searching venues', { error, query });
    return [];
  }
}

async function searchProfiles(
  query: string,
  threshold: number,
  limit: number,
  useFuzzy: boolean
): Promise<ProfileSearchResult[]> {
  try {
    if (useFuzzy) {
      const { data, error } = await rpc('search_profiles_fuzzy', {
        p_query: query,
        p_threshold: threshold,
        p_limit: limit,
      });

      if (error) throw error;
      return (data || []) as ProfileSearchResult[];
    }

    // Fallback to ILIKE
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, full_name, avatar_url')
      .or(`display_name.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      similarity_score: 0.5,
    })) as ProfileSearchResult[];
  } catch (error) {
    logger.error('Error searching profiles', { error, query });
    return [];
  }
}

async function searchOrganizations(
  query: string,
  threshold: number,
  limit: number,
  useFuzzy: boolean
): Promise<OrganizationSearchResult[]> {
  try {
    if (useFuzzy) {
      const { data, error } = await rpc('search_organizations_fuzzy', {
        p_query: query,
        p_threshold: threshold,
        p_limit: limit,
      });

      if (error) throw error;
      return (data || []) as OrganizationSearchResult[];
    }

    // Fallback to ILIKE - organizations table may not exist in types yet
    try {
      const { data, error } = await (supabase as unknown as { from: (table: string) => { select: (cols: string) => { ilike: (col: string, val: string) => { limit: (n: number) => Promise<{ data: Array<{ id: string; name: string; profile_picture?: string }>; error: unknown }> } } } })
        .from('organizations')
        .select('id, name, profile_picture')
        .ilike('name', `%${query}%`)
        .limit(limit);

      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        logo_url: item.profile_picture,
        similarity_score: 0.5,
      }));
    } catch {
      // Organizations table might not exist
      return [];
    }
  } catch (error) {
    logger.error('Error searching organizations', { error, query });
    return [];
  }
}
