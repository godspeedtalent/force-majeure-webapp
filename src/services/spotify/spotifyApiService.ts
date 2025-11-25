/**
 * Spotify API Service
 *
 * Handles Spotify Web API calls for artist search and data fetching.
 * Uses Client Credentials flow for server-to-server requests.
 */

import { logger } from '@/shared/services/logger';

// Spotify API types
export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  genres: string[];
  popularity: number;
  followers: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
  uri: string;
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifySearchResponse {
  artists: {
    items: SpotifyArtist[];
    total: number;
    limit: number;
    offset: number;
  };
}

// Token management
let accessToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Get Spotify API credentials from environment
 */
function getCredentials() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Spotify API credentials not configured. Please set VITE_SPOTIFY_CLIENT_ID and VITE_SPOTIFY_CLIENT_SECRET in .env'
    );
  }

  return { clientId, clientSecret };
}

/**
 * Get access token using Client Credentials flow
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const { clientId, clientSecret } = getCredentials();

  try {
    logger.info('Fetching Spotify access token');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to fetch Spotify access token', { error, status: response.status });
      throw new Error(`Spotify authentication failed: ${response.status}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Set expiry to 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    logger.info('Spotify access token obtained successfully');
    return accessToken || '';
  } catch (error) {
    logger.error('Error getting Spotify access token', { error });
    throw error;
  }
}

/**
 * Search for artists on Spotify
 */
export async function searchSpotifyArtists(
  query: string,
  limit: number = 10
): Promise<SpotifyArtist[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const token = await getAccessToken();
    const encodedQuery = encodeURIComponent(query);

    logger.info('Searching Spotify artists', { query, limit });

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodedQuery}&type=artist&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('Spotify artist search failed', { error, status: response.status });
      throw new Error(`Spotify search failed: ${response.status}`);
    }

    const data: SpotifySearchResponse = await response.json();
    logger.info('Spotify artist search successful', { resultCount: data.artists.items.length });

    return data.artists.items;
  } catch (error) {
    logger.error('Error searching Spotify artists', { error, query });
    throw error;
  }
}

/**
 * Get detailed artist information from Spotify by ID
 */
export async function getSpotifyArtist(artistId: string): Promise<SpotifyArtist> {
  try {
    const token = await getAccessToken();

    logger.info('Fetching Spotify artist details', { artistId });

    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to fetch Spotify artist', { error, status: response.status, artistId });
      throw new Error(`Failed to fetch Spotify artist: ${response.status}`);
    }

    const artist: SpotifyArtist = await response.json();
    logger.info('Spotify artist fetched successfully', { artistId, name: artist.name });

    return artist;
  } catch (error) {
    logger.error('Error fetching Spotify artist', { error, artistId });
    throw error;
  }
}

/**
 * Get multiple artists by their Spotify IDs
 */
export async function getSpotifyArtists(artistIds: string[]): Promise<SpotifyArtist[]> {
  if (artistIds.length === 0) {
    return [];
  }

  try {
    const token = await getAccessToken();
    const ids = artistIds.slice(0, 50).join(','); // Spotify API allows max 50 IDs

    logger.info('Fetching multiple Spotify artists', { count: artistIds.length });

    const response = await fetch(`https://api.spotify.com/v1/artists?ids=${ids}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to fetch Spotify artists', { error, status: response.status });
      throw new Error(`Failed to fetch Spotify artists: ${response.status}`);
    }

    const data = await response.json();
    return data.artists;
  } catch (error) {
    logger.error('Error fetching Spotify artists', { error });
    throw error;
  }
}

/**
 * Clear cached access token (useful for testing or error recovery)
 */
export function clearSpotifyToken() {
  accessToken = null;
  tokenExpiry = null;
  logger.info('Spotify access token cleared');
}
