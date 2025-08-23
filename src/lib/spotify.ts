import { supabase } from '@/integrations/supabase/client';
import { logApiError, logApi } from '@/lib/logger';

export interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class SpotifyService {
  private static instance: SpotifyService;
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  private constructor() {}

  static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  async getValidAccessToken(): Promise<string | null> {
    await logApi({ endpoint: 'spotify-auth', method: 'POST', message: 'getValidAccessToken start' });
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000) {
      await logApi({ endpoint: 'spotify-auth', method: 'CACHE', message: 'Using cached Spotify token' });
      return this.accessToken;
    }

    // Get a new client credentials token
    return await this.getClientCredentialsToken();
  }

  private async getClientCredentialsToken(): Promise<string | null> {
    try {
  await logApi({ endpoint: 'spotify-auth', method: 'POST', message: 'Requesting client credentials token' });
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'client_credentials'
        }
      });

      if (error) {
        console.error('Error getting client credentials token:', error);
        await logApiError({
          endpoint: 'spotify-auth',
          method: 'POST',
          message: 'Error getting client credentials token',
          details: error,
        });
        return null;
      }

      // Store the token
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      await logApi({ endpoint: 'spotify-auth', method: 'POST', message: 'Received client credentials token', details: { expires_in: data.expires_in } });
      return data.access_token;
    } catch (error) {
      console.error('Error getting client credentials token:', error);
      await logApiError({
        endpoint: 'spotify-auth',
        method: 'POST',
        message: 'Exception getting client credentials token',
        details: String(error),
      });
      return null;
    }
  }

  async searchTracks(query: string, limit: number = 20): Promise<any> {
    await logApi({ endpoint: 'https://api.spotify.com/v1/search', method: 'GET', message: 'searchTracks start', details: { query, limit } });
    const token = await this.getValidAccessToken();
    if (!token) {
      throw new Error('No valid Spotify access token');
    }

    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      await logApiError({
        endpoint: 'https://api.spotify.com/v1/search',
        method: 'GET',
        status: response.status,
        message: 'Spotify search error',
        details: await response.text().catch(() => undefined)
      });
      throw new Error(`Spotify API error: ${response.status}`);
    }

  const json = await response.json();
  await logApi({ endpoint: 'https://api.spotify.com/v1/search', method: 'GET', message: 'searchTracks success', details: { items: json?.tracks?.items?.length ?? 0 } });
  return json;
  }

  async getTrack(trackId: string): Promise<any> {
  await logApi({ endpoint: `https://api.spotify.com/v1/tracks/${trackId}`, method: 'GET', message: 'getTrack start' });
    const token = await this.getValidAccessToken();
    if (!token) {
      throw new Error('No valid Spotify access token');
    }

    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      await logApiError({
        endpoint: `https://api.spotify.com/v1/tracks/${trackId}`,
        method: 'GET',
        status: response.status,
        message: 'Spotify track fetch error',
        details: await response.text().catch(() => undefined)
      });
      throw new Error(`Spotify API error: ${response.status}`);
    }

  const json = await response.json();
  await logApi({ endpoint: `https://api.spotify.com/v1/tracks/${trackId}`, method: 'GET', message: 'getTrack success', details: { has_preview: !!json?.preview_url } });
  return json;
  }

  /**
   * Extract a Spotify track ID from a link or URI.
   * Accepts formats like:
   * - spotify:track:<id>
   * - https://open.spotify.com/track/<id>?...
   * - <id> (plain ID)
   */
  parseTrackIdFromLink(linkOrId: string): string | null {
    if (!linkOrId) return null;
    // spotify URI
    const uriMatch = linkOrId.match(/^spotify:track:([a-zA-Z0-9]+)$/);
    if (uriMatch) return uriMatch[1];

    // open.spotify.com URL
    try {
      const url = new URL(linkOrId);
      if (url.hostname.includes('open.spotify.com')) {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts[0] === 'track' && parts[1]) {
          return parts[1];
        }
      }
    } catch {
      // Not a URL, fall through
    }

    // If it already looks like a preview mp3, return null to signal no resolution needed
    if (/\.mp3($|\?)/i.test(linkOrId) || /p\.scdn\.co\/mp3-preview\//.test(linkOrId)) {
      return null;
    }

    // Assume it's an ID if alphanumeric
    if (/^[a-zA-Z0-9]+$/.test(linkOrId)) return linkOrId;

    return null;
  }

  /**
   * Given a Spotify track link/URI/ID, fetches the track and returns its preview_url if available.
   */
  async getPreviewUrl(linkOrId: string): Promise<string | null> {
    await logApi({ endpoint: 'spotify:getPreviewUrl', method: 'LOCAL', message: 'getPreviewUrl start' });
    // If it's already an mp3 preview URL, return as-is
    if (/p\.scdn\.co\/mp3-preview\//.test(linkOrId) || /\.mp3($|\?)/i.test(linkOrId)) {
      await logApi({ endpoint: 'spotify:getPreviewUrl', method: 'LOCAL', message: 'Input already preview URL' });
      return linkOrId;
    }

    const id = this.parseTrackIdFromLink(linkOrId);
    if (!id) {
      await logApi({ endpoint: 'spotify:getPreviewUrl', method: 'LOCAL', message: 'No track id parsed' });
      return null;
    }
    const track = await this.getTrack(id);
    const preview = track?.preview_url || null;
    await logApi({ endpoint: 'spotify:getPreviewUrl', method: 'LOCAL', message: 'Resolved preview', details: { has_preview: !!preview } });
    return preview;
  }

  /**
   * Given a Spotify track link/URI/ID, returns an album art URL.
   * size: 'small' | 'medium' | 'large' maps to images[2], images[1], images[0].
   */
  async getAlbumArtUrl(linkOrId: string, size: 'small' | 'medium' | 'large' = 'medium'): Promise<string | null> {
    await logApi({ endpoint: 'spotify:getAlbumArtUrl', method: 'LOCAL', message: 'getAlbumArtUrl start', details: { size } });
    // If it's already an absolute image URL, return as-is
    if (/^https?:\/\//i.test(linkOrId) && /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(linkOrId)) {
      await logApi({ endpoint: 'spotify:getAlbumArtUrl', method: 'LOCAL', message: 'Input already image URL' });
      return linkOrId;
    }

    const id = this.parseTrackIdFromLink(linkOrId);
    if (!id) {
      await logApi({ endpoint: 'spotify:getAlbumArtUrl', method: 'LOCAL', message: 'No track id parsed' });
      return null;
    }
    const track = await this.getTrack(id);
    const images: Array<{ url: string; width: number; height: number }> | undefined = track?.album?.images;
    if (!images || images.length === 0) return null;
    if (size === 'large') return images[0]?.url || images[1]?.url || images[2]?.url || null;
    if (size === 'small') return images[2]?.url || images[1]?.url || images[0]?.url || null;
    const picked = images[1]?.url || images[0]?.url || images[2]?.url || null;
    await logApi({ endpoint: 'spotify:getAlbumArtUrl', method: 'LOCAL', message: 'Album art resolved', details: { picked: !!picked } });
    return picked;
  }
}