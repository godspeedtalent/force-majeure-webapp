/**
 * useArtistSocialStats
 *
 * Hook for fetching and managing artist social media statistics.
 * Implements write-through caching:
 * - Fetches from database first
 * - Auto-refreshes from APIs if data is stale (>24 hours)
 * - Provides mutation for manual updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, logger } from '@/shared';
import {
  ArtistSocialStats,
  ArtistSocialStatsRow,
  SocialStatsInput,
  toArtistSocialStats,
  toSocialStatsRow,
  createEmptySocialStats,
} from '../types/socialStats';

/**
 * Helper to access the artist_social_stats table.
 * The table may not yet be in generated Supabase types until migration is run.
 * This helper provides proper typing for the table operations.
 *
 * TODO: Remove this workaround once migration is run and types are regenerated
 */
function getStatsTable() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  return client.from('artist_social_stats');
}

// Cache staleness threshold (24 hours in milliseconds)
const CACHE_STALE_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// Query Keys
// ============================================================================

export const socialStatsKeys = {
  all: ['artist-social-stats'] as const,
  detail: (artistId: string) => [...socialStatsKeys.all, 'detail', artistId] as const,
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if cached stats are stale (older than 24 hours)
 */
function isStale(updatedAt: string | null): boolean {
  if (!updatedAt) return true;
  const updatedTime = new Date(updatedAt).getTime();
  const now = Date.now();
  return now - updatedTime > CACHE_STALE_MS;
}

// ============================================================================
// Fetch Functions
// ============================================================================

/**
 * Fetch social stats from database
 */
async function fetchSocialStats(artistId: string): Promise<ArtistSocialStats | null> {
  const { data, error } = await getStatsTable()
    .select('*')
    .eq('artist_id', artistId)
    .single();

  if (error) {
    // No record found is not an error - just means no stats yet
    if (error.code === 'PGRST116') {
      return null;
    }
    logger.error('Error fetching social stats', {
      error: error.message,
      artistId,
      source: 'useArtistSocialStats',
    });
    throw error;
  }

  return toArtistSocialStats(data as ArtistSocialStatsRow);
}

/**
 * Upsert social stats to database
 */
async function upsertSocialStats(input: SocialStatsInput): Promise<ArtistSocialStats> {
  const row = toSocialStatsRow(input);

  const { data, error } = await getStatsTable()
    .upsert(
      {
        ...row,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'artist_id',
      }
    )
    .select()
    .single();

  if (error) {
    logger.error('Error upserting social stats', {
      error: error.message,
      artistId: input.artistId,
      source: 'useArtistSocialStats',
    });
    throw error;
  }

  return toArtistSocialStats(data as ArtistSocialStatsRow);
}

// ============================================================================
// Hooks
// ============================================================================

interface UseArtistSocialStatsOptions {
  /** Whether to auto-refresh from APIs if data is stale */
  autoRefresh?: boolean;
}

interface UseArtistSocialStatsResult {
  /** Current social stats (null if not loaded yet) */
  stats: ArtistSocialStats | null;
  /** Whether stats are being loaded */
  isLoading: boolean;
  /** Whether stats are being refreshed from APIs */
  isRefreshing: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Whether the cached data is stale */
  isStale: boolean;
  /** Manually update a stat value */
  updateStat: (field: keyof SocialStatsInput, value: number | null) => Promise<void>;
  /** Update multiple stats at once */
  updateStats: (updates: Partial<SocialStatsInput>) => Promise<void>;
  /** Refresh stats from APIs (Spotify, SoundCloud) */
  refreshFromApis: () => Promise<void>;
}

/**
 * Hook to fetch and manage artist social media statistics
 *
 * @param artistId - The artist ID to fetch stats for (null/undefined to skip)
 * @param options - Configuration options
 */
export function useArtistSocialStats(
  artistId: string | null | undefined,
  options: UseArtistSocialStatsOptions = {}
): UseArtistSocialStatsResult {
  const { autoRefresh = false } = options;
  const queryClient = useQueryClient();

  // Main query for fetching stats
  const {
    data: stats,
    isLoading,
    error,
    isFetching: isRefreshing,
  } = useQuery({
    queryKey: socialStatsKeys.detail(artistId || ''),
    queryFn: async () => {
      if (!artistId) return null;

      const existingStats = await fetchSocialStats(artistId);

      // If no stats exist, return empty stats for this artist
      if (!existingStats) {
        return createEmptySocialStats(artistId);
      }

      // TODO: If autoRefresh is enabled and stats are stale, trigger API refresh
      // This would call Spotify/SoundCloud APIs and update the database
      // For now, just return existing stats
      if (autoRefresh && isStale(existingStats.updatedAt)) {
        logger.info('Social stats are stale, would refresh from APIs', {
          artistId,
          updatedAt: existingStats.updatedAt,
          source: 'useArtistSocialStats',
        });
        // Future: await refreshFromApisInternal(artistId, existingStats);
      }

      return existingStats;
    },
    enabled: Boolean(artistId),
    staleTime: 5 * 60 * 1000, // 5 minutes frontend cache
  });

  // Mutation for updating stats
  const updateMutation = useMutation({
    mutationFn: async (input: SocialStatsInput) => {
      return upsertSocialStats(input);
    },
    onSuccess: (updatedStats) => {
      // Update the cache with new stats
      queryClient.setQueryData(socialStatsKeys.detail(updatedStats.artistId), updatedStats);
    },
    onError: (error) => {
      logger.error('Failed to update social stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useArtistSocialStats',
      });
    },
  });

  // Update a single stat
  const updateStat = async (
    field: keyof SocialStatsInput,
    value: number | null
  ): Promise<void> => {
    if (!artistId) return;

    const currentStats = stats || createEmptySocialStats(artistId);
    await updateMutation.mutateAsync({
      artistId,
      spotifyLocalListeners: currentStats.spotifyLocalListeners,
      spotifyRegionalListeners: currentStats.spotifyRegionalListeners,
      spotifyFollowers: currentStats.spotifyFollowers,
      soundcloudFollowers: currentStats.soundcloudFollowers,
      instagramFollowers: currentStats.instagramFollowers,
      tiktokFollowers: currentStats.tiktokFollowers,
      [field]: value,
    });
  };

  // Update multiple stats at once
  const updateStats = async (updates: Partial<SocialStatsInput>): Promise<void> => {
    if (!artistId) return;

    const currentStats = stats || createEmptySocialStats(artistId);
    await updateMutation.mutateAsync({
      artistId,
      spotifyLocalListeners: updates.spotifyLocalListeners ?? currentStats.spotifyLocalListeners,
      spotifyRegionalListeners:
        updates.spotifyRegionalListeners ?? currentStats.spotifyRegionalListeners,
      spotifyFollowers: updates.spotifyFollowers ?? currentStats.spotifyFollowers,
      soundcloudFollowers: updates.soundcloudFollowers ?? currentStats.soundcloudFollowers,
      instagramFollowers: updates.instagramFollowers ?? currentStats.instagramFollowers,
      tiktokFollowers: updates.tiktokFollowers ?? currentStats.tiktokFollowers,
    });
  };

  // Refresh from APIs (placeholder - to be implemented with actual API calls)
  const refreshFromApis = async (): Promise<void> => {
    if (!artistId) return;

    logger.info('Refreshing social stats from APIs', {
      artistId,
      source: 'useArtistSocialStats',
    });

    // TODO: Implement actual API calls to Spotify and SoundCloud
    // For now, just invalidate the query to trigger a refetch
    await queryClient.invalidateQueries({ queryKey: socialStatsKeys.detail(artistId) });
  };

  return {
    stats: stats ?? null,
    isLoading,
    isRefreshing,
    error: error as Error | null,
    isStale: stats ? isStale(stats.updatedAt) : true,
    updateStat,
    updateStats,
    refreshFromApis,
  };
}
