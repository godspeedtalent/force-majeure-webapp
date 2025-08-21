import { supabase } from '@/integrations/supabase/client';

const SPOTIFY_CLIENT_ID = "86af655c93cf4488a361d436be7eb995";
const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state'
].join(' ');

export interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export class SpotifyService {
  private static instance: SpotifyService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  private constructor() {
    this.loadTokensFromStorage();
  }

  static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('spotify_access_token');
    this.refreshToken = localStorage.getItem('spotify_refresh_token');
    const expiry = localStorage.getItem('spotify_token_expiry');
    this.tokenExpiry = expiry ? parseInt(expiry) : null;
  }

  private saveTokensToStorage(tokenData: SpotifyToken) {
    this.accessToken = tokenData.access_token;
    this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);

    localStorage.setItem('spotify_access_token', tokenData.access_token);
    localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());

    if (tokenData.refresh_token) {
      this.refreshToken = tokenData.refresh_token;
      localStorage.setItem('spotify_refresh_token', tokenData.refresh_token);
    }
  }

  private clearTokensFromStorage() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
  }

  async getAuthUrl(): Promise<string> {
    const redirectUri = `${window.location.origin}/callback`;
    const state = Math.random().toString(36).substring(2, 15);
    
    localStorage.setItem('spotify_auth_state', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: SPOTIFY_SCOPES,
      redirect_uri: redirectUri,
      state: state
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async handleAuthCallback(code: string, state: string): Promise<boolean> {
    const storedState = localStorage.getItem('spotify_auth_state');
    
    if (state !== storedState) {
      console.error('State mismatch in Spotify auth callback');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'get_access_token',
          code: code
        }
      });

      if (error) {
        console.error('Error getting access token:', error);
        return false;
      }

      this.saveTokensToStorage(data);
      localStorage.removeItem('spotify_auth_state');
      return true;
    } catch (error) {
      console.error('Error in auth callback:', error);
      return false;
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    // Try to refresh the token if we have a refresh token
    if (this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.accessToken;
      }
    }

    // Try to get a token using client credentials (app-only access)
    const clientToken = await this.getClientCredentialsToken();
    if (clientToken) {
      return clientToken;
    }

    return null;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'refresh_token',
          refreshToken: this.refreshToken
        }
      });

      if (error) {
        console.error('Error refreshing token:', error);
        this.clearTokensFromStorage();
        return false;
      }

      this.saveTokensToStorage(data);
      return true;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      this.clearTokensFromStorage();
      return false;
    }
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

      // Store temporarily for this session (client credentials tokens can't be refreshed)
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

  isAuthenticated(): boolean {
    return this.accessToken !== null && this.tokenExpiry !== null && Date.now() < this.tokenExpiry;
  }

  logout() {
    this.clearTokensFromStorage();
  }
}