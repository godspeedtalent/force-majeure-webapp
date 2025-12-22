/**
 * Spotify API Service
 *
 * Handles Spotify Web API calls for artist search and data fetching.
 * Uses an edge function to securely access Spotify API with credentials stored in Supabase.
 */
import { logger } from '@/shared';
import { supabase } from '@/integrations/supabase/client';
// Edge function base URL
const EDGE_FUNCTION_URL = 'https://orgxcrnnecblhuxjfruy.supabase.co/functions/v1/spotify-api';
/**
 * Call the Spotify edge function
 */
async function callSpotifyFunction(params) {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`${EDGE_FUNCTION_URL}?${params.toString()}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
    });
    return response;
}
/**
 * Search for artists on Spotify
 */
export async function searchSpotifyArtists(query, limit = 10) {
    if (!query.trim()) {
        return [];
    }
    try {
        logger.info('Searching Spotify artists', { query, limit });
        const params = new URLSearchParams({
            action: 'search',
            q: query,
            limit: limit.toString(),
        });
        const response = await callSpotifyFunction(params);
        if (!response.ok) {
            const error = await response.json();
            logger.error('Spotify artist search failed', { error, status: response.status });
            throw new Error(error.error || `Spotify search failed: ${response.status}`);
        }
        const data = await response.json();
        logger.info('Spotify artist search successful', { resultCount: data.artists.items.length });
        return data.artists.items;
    }
    catch (error) {
        logger.error('Error searching Spotify artists', { error, query });
        throw error;
    }
}
/**
 * Get detailed artist information from Spotify by ID
 */
export async function getSpotifyArtist(artistId) {
    try {
        logger.info('Fetching Spotify artist details', { artistId });
        const params = new URLSearchParams({
            action: 'artist',
            id: artistId,
        });
        const response = await callSpotifyFunction(params);
        if (!response.ok) {
            const error = await response.json();
            logger.error('Failed to fetch Spotify artist', { error, status: response.status, artistId });
            throw new Error(error.error || `Failed to fetch Spotify artist: ${response.status}`);
        }
        const artist = await response.json();
        logger.info('Spotify artist fetched successfully', { artistId, name: artist.name });
        return artist;
    }
    catch (error) {
        logger.error('Error fetching Spotify artist', { error, artistId });
        throw error;
    }
}
/**
 * Get multiple artists by their Spotify IDs
 * Note: This currently fetches artists one by one since the edge function doesn't support batch requests yet
 */
export async function getSpotifyArtists(artistIds) {
    if (artistIds.length === 0) {
        return [];
    }
    try {
        logger.info('Fetching multiple Spotify artists', { count: artistIds.length });
        // Fetch artists in parallel (limit to first 50 like Spotify API)
        const limitedIds = artistIds.slice(0, 50);
        const artists = await Promise.all(limitedIds.map(id => getSpotifyArtist(id).catch(() => null)));
        return artists.filter((artist) => artist !== null);
    }
    catch (error) {
        logger.error('Error fetching Spotify artists', { error });
        throw error;
    }
}
/**
 * Extract Spotify artist ID from a URL
 * Handles URLs like:
 * - https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb
 * - https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb?si=xxx
 * - spotify:artist:4Z8W4fKeB5YxbusRsdQVPb
 */
export function extractSpotifyArtistId(url) {
    // Handle spotify URLs
    const urlMatch = url.match(/spotify\.com\/artist\/([a-zA-Z0-9]+)/);
    if (urlMatch)
        return urlMatch[1];
    // Handle spotify URIs
    const uriMatch = url.match(/spotify:artist:([a-zA-Z0-9]+)/);
    if (uriMatch)
        return uriMatch[1];
    return null;
}
/**
 * Check if a string is a Spotify artist URL or URI
 */
export function isSpotifyArtistUrl(input) {
    return extractSpotifyArtistId(input) !== null;
}
/**
 * Get an artist's top tracks from Spotify
 * @param artistId - The Spotify artist ID
 * @param market - The market/country code (default: US)
 * @returns Array of top tracks (usually 10)
 */
export async function getArtistTopTracks(artistId, market = 'US') {
    try {
        logger.info('Fetching Spotify artist top tracks', { artistId, market });
        const params = new URLSearchParams({
            action: 'top-tracks',
            id: artistId,
            market,
        });
        const response = await callSpotifyFunction(params);
        if (!response.ok) {
            const error = await response.json();
            logger.error('Failed to fetch artist top tracks', { error, status: response.status, artistId });
            throw new Error(error.error || `Failed to fetch artist top tracks: ${response.status}`);
        }
        const data = await response.json();
        logger.info('Spotify artist top tracks fetched', { artistId, trackCount: data.tracks?.length || 0 });
        return data.tracks || [];
    }
    catch (error) {
        logger.error('Error fetching artist top tracks', { error, artistId });
        throw error;
    }
}
/**
 * Clear cached access token (no-op now since tokens are managed by edge function)
 */
export function clearSpotifyToken() {
    logger.info('Spotify token management is now handled by edge function');
}
