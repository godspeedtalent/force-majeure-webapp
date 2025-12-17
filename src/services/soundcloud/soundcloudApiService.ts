/**
 * SoundCloud API Service
 *
 * Handles SoundCloud API calls for user/artist search and data fetching.
 * Uses SoundCloud's oEmbed and resolve endpoints.
 */

import { logger } from '@/shared';

// SoundCloud User types
export interface SoundCloudUser {
  id: number;
  username: string;
  permalink: string;
  permalink_url: string;
  avatar_url: string;
  description: string | null;
  followers_count: number;
  track_count: number;
  playlist_count: number;
  city: string | null;
  country: string | null;
  full_name: string;
}

export interface SoundCloudOEmbedResponse {
  version: number;
  type: string;
  provider_name: string;
  provider_url: string;
  title: string;
  description: string;
  thumbnail_url: string;
  html: string;
  author_name: string;
  author_url: string;
}

/**
 * Resolve a SoundCloud URL to get user information via oEmbed
 * This works without an API key
 */
export async function resolveSoundCloudUser(url: string): Promise<SoundCloudOEmbedResponse | null> {
  if (!url.includes('soundcloud.com')) {
    return null;
  }

  try {
    logger.info('Resolving SoundCloud URL', { url });

    const oEmbedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    const response = await fetch(oEmbedUrl);

    if (!response.ok) {
      logger.error('Failed to resolve SoundCloud URL', { status: response.status, url });
      return null;
    }

    const data: SoundCloudOEmbedResponse = await response.json();
    logger.info('SoundCloud URL resolved successfully', { authorName: data.author_name });

    return data;
  } catch (error) {
    logger.error('Error resolving SoundCloud URL', { error, url });
    return null;
  }
}

/**
 * Parse a SoundCloud profile URL to extract username
 */
export function extractSoundCloudUsername(url: string): string | null {
  // Handle URLs like:
  // https://soundcloud.com/username
  // https://soundcloud.com/username/tracks
  // https://soundcloud.com/username/sets/playlist-name
  const match = url.match(/soundcloud\.com\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Build a SoundCloud profile URL from username
 */
export function buildSoundCloudProfileUrl(username: string): string {
  return `https://soundcloud.com/${username}`;
}

export interface SoundCloudTrackData {
  name: string;
  url: string;
  coverArt: string;
  artistName: string;
}

/**
 * Fetch user profile information from a SoundCloud URL
 * Returns basic profile data extracted from oEmbed response
 */
export async function getSoundCloudUserFromUrl(url: string): Promise<{
  name: string;
  profileUrl: string;
  avatarUrl: string;
  description: string;
} | null> {
  const oEmbedData = await resolveSoundCloudUser(url);

  if (!oEmbedData) {
    return null;
  }

  return {
    name: oEmbedData.author_name,
    profileUrl: oEmbedData.author_url,
    avatarUrl: oEmbedData.thumbnail_url,
    description: oEmbedData.description || '',
  };
}

/**
 * Get a track from a SoundCloud URL using oEmbed
 * Works for track URLs like: https://soundcloud.com/artist/track-name
 */
export async function getSoundCloudTrackFromUrl(url: string): Promise<SoundCloudTrackData | null> {
  try {
    logger.info('Fetching SoundCloud track from URL', { url });

    const oEmbedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    const response = await fetch(oEmbedUrl);

    if (!response.ok) {
      logger.error('Failed to fetch SoundCloud track', { status: response.status, url });
      return null;
    }

    const data: SoundCloudOEmbedResponse = await response.json();

    // Parse track name from title (usually "Track Name by Artist Name")
    let trackName = data.title || 'Unknown Track';
    const artistName = data.author_name || 'Unknown Artist';

    if (trackName.includes(' by ')) {
      const parts = trackName.split(' by ');
      trackName = parts[0];
    }

    logger.info('SoundCloud track fetched successfully', { trackName, artistName });

    return {
      name: trackName,
      url: url,
      coverArt: data.thumbnail_url,
      artistName: artistName,
    };
  } catch (error) {
    logger.error('Error fetching SoundCloud track', { error, url });
    return null;
  }
}

/**
 * Try to get a popular track from an artist's SoundCloud profile
 * Since SoundCloud's API is limited, we'll try the /popular-tracks endpoint
 * which sometimes works, falling back to just the profile URL
 */
export async function getArtistPopularTrack(profileUrl: string): Promise<SoundCloudTrackData | null> {
  const username = extractSoundCloudUsername(profileUrl);
  if (!username) {
    return null;
  }

  // Try to get the tracks page which might have their popular tracks
  // SoundCloud shows tracks at /username/tracks
  const tracksUrl = `https://soundcloud.com/${username}/tracks`;

  try {
    logger.info('Attempting to fetch artist popular track', { username });

    // Try the tracks URL via oEmbed - this might return the first/popular track
    const oEmbedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(tracksUrl)}`;
    const response = await fetch(oEmbedUrl);

    if (response.ok) {
      const data: SoundCloudOEmbedResponse = await response.json();

      // If we got a track back (type will be "rich" for tracks)
      if (data.title && data.thumbnail_url) {
        let trackName = data.title;
        if (trackName.includes(' by ')) {
          trackName = trackName.split(' by ')[0];
        }

        // The oEmbed might return the profile page, not a specific track
        // Check if the thumbnail looks like a track (has artwork) vs profile
        return {
          name: trackName,
          url: tracksUrl,
          coverArt: data.thumbnail_url,
          artistName: data.author_name,
        };
      }
    }

    logger.info('Could not fetch popular track via oEmbed', { username });
    return null;
  } catch (error) {
    logger.error('Error fetching artist popular track', { error, username });
    return null;
  }
}
