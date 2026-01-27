/**
 * Delphi - Social Stats Types
 *
 * Types for artist social media statistics used in ticket sales forecasting.
 */

/**
 * Social media statistics for an artist
 * Maps to the artist_social_stats database table
 */
export interface ArtistSocialStats {
  id: string;
  artistId: string;

  // Spotify metrics
  spotifyLocalListeners: number | null;
  spotifyRegionalListeners: number | null;
  spotifyFollowers: number | null;

  // Other platforms
  soundcloudFollowers: number | null;
  instagramFollowers: number | null;
  tiktokFollowers: number | null;

  // Metadata
  updatedAt: string | null;
  createdAt: string | null;
}

/**
 * Database row format (snake_case)
 */
export interface ArtistSocialStatsRow {
  id: string;
  artist_id: string;
  spotify_local_listeners: number | null;
  spotify_regional_listeners: number | null;
  spotify_followers: number | null;
  soundcloud_followers: number | null;
  instagram_followers: number | null;
  tiktok_followers: number | null;
  updated_at: string | null;
  created_at: string | null;
}

/**
 * Input for creating/updating social stats
 */
export interface SocialStatsInput {
  artistId: string;
  spotifyLocalListeners?: number | null;
  spotifyRegionalListeners?: number | null;
  spotifyFollowers?: number | null;
  soundcloudFollowers?: number | null;
  instagramFollowers?: number | null;
  tiktokFollowers?: number | null;
}

/**
 * Metric definition for the forecasting UI
 */
export interface SocialMetricDefinition {
  id: keyof Omit<ArtistSocialStats, 'id' | 'artistId' | 'updatedAt' | 'createdAt'>;
  label: string;
  description: string;
  source: 'api' | 'manual';
  platform: 'spotify' | 'soundcloud' | 'instagram' | 'tiktok';
}

/**
 * All available social metrics for forecasting
 */
export const SOCIAL_METRICS: SocialMetricDefinition[] = [
  {
    id: 'spotifyLocalListeners',
    label: 'Spotify Local Listeners',
    description: 'Monthly listeners in the local market area',
    source: 'manual',
    platform: 'spotify',
  },
  {
    id: 'spotifyRegionalListeners',
    label: 'Spotify Regional Listeners',
    description: 'Monthly listeners in the broader region',
    source: 'manual',
    platform: 'spotify',
  },
  {
    id: 'spotifyFollowers',
    label: 'Spotify Followers',
    description: 'Total Spotify followers (global)',
    source: 'api',
    platform: 'spotify',
  },
  {
    id: 'soundcloudFollowers',
    label: 'SoundCloud Followers',
    description: 'Total SoundCloud followers',
    source: 'api',
    platform: 'soundcloud',
  },
  {
    id: 'instagramFollowers',
    label: 'Instagram Followers',
    description: 'Total Instagram followers',
    source: 'manual',
    platform: 'instagram',
  },
  {
    id: 'tiktokFollowers',
    label: 'TikTok Followers',
    description: 'Total TikTok followers',
    source: 'manual',
    platform: 'tiktok',
  },
];

/**
 * Conversion from database row to domain object
 */
export function toArtistSocialStats(row: ArtistSocialStatsRow): ArtistSocialStats {
  return {
    id: row.id,
    artistId: row.artist_id,
    spotifyLocalListeners: row.spotify_local_listeners,
    spotifyRegionalListeners: row.spotify_regional_listeners,
    spotifyFollowers: row.spotify_followers,
    soundcloudFollowers: row.soundcloud_followers,
    instagramFollowers: row.instagram_followers,
    tiktokFollowers: row.tiktok_followers,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

/**
 * Conversion from domain object to database row (for upsert)
 */
export function toSocialStatsRow(
  input: SocialStatsInput
): Omit<ArtistSocialStatsRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    artist_id: input.artistId,
    spotify_local_listeners: input.spotifyLocalListeners ?? null,
    spotify_regional_listeners: input.spotifyRegionalListeners ?? null,
    spotify_followers: input.spotifyFollowers ?? null,
    soundcloud_followers: input.soundcloudFollowers ?? null,
    instagram_followers: input.instagramFollowers ?? null,
    tiktok_followers: input.tiktokFollowers ?? null,
  };
}

/**
 * Create empty stats object for a new artist
 */
export function createEmptySocialStats(artistId: string): ArtistSocialStats {
  return {
    id: '',
    artistId,
    spotifyLocalListeners: null,
    spotifyRegionalListeners: null,
    spotifyFollowers: null,
    soundcloudFollowers: null,
    instagramFollowers: null,
    tiktokFollowers: null,
    updatedAt: null,
    createdAt: null,
  };
}
