import { supabase } from '@/integrations/supabase/client';

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
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    // Get a new client credentials token
    return await this.getClientCredentialsToken();
  }

  private async getClientCredentialsToken(): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'client_credentials'
        }
      });

      if (error) {
        console.error('Error getting client credentials token:', error);
        return null;
      }

      // Store the token
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      return data.access_token;
    } catch (error) {
      console.error('Error getting client credentials token:', error);
      return null;
    }
  }

  async searchTracks(query: string, limit: number = 20): Promise<any> {
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
      throw new Error(`Spotify API error: ${response.status}`);
    }

    return response.json();
  }

  async getTrack(trackId: string): Promise<any> {
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
      throw new Error(`Spotify API error: ${response.status}`);
    }

    return response.json();
  }
}