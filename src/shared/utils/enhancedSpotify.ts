import { supabase } from '@/shared/api/supabase/client';

interface SpotifyAuthService {
  getAuthUrl: (redirectUri: string, userId: string) => Promise<string>;
  exchangeCodeForTokens: (
    code: string,
    redirectUri: string,
    userId: string
  ) => Promise<{ success: boolean; error?: any }>;
  refreshUserToken: (
    userId: string
  ) => Promise<{ accessToken?: string; error?: any }>;
  getUserAccessToken: (
    userId: string
  ) => Promise<{ accessToken?: string; error?: any }>;
}

class EnhancedSpotifyService implements SpotifyAuthService {
  private static instance: EnhancedSpotifyService;

  static getInstance(): EnhancedSpotifyService {
    if (!EnhancedSpotifyService.instance) {
      EnhancedSpotifyService.instance = new EnhancedSpotifyService();
    }
    return EnhancedSpotifyService.instance;
  }

  async getAuthUrl(redirectUri: string, userId: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'get_auth_url',
          redirectUri,
          userId,
        },
      });

      if (error) {
        throw new Error(`Failed to get auth URL: ${error.message}`);
      }

      return data.authUrl;
    } catch (error) {
      console.error('Error getting Spotify auth URL:', error);
      throw error;
    }
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
    userId: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'exchange_code',
          code,
          redirectUri,
          userId,
        },
      });

      if (error) {
        return { success: false, error };
      }

      return { success: data.success };
    } catch (error) {
      console.error('Error exchanging Spotify code:', error);
      return { success: false, error };
    }
  }

  async refreshUserToken(
    userId: string
  ): Promise<{ accessToken?: string; error?: any }> {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'refresh_token',
          userId,
        },
      });

      if (error) {
        return { error };
      }

      return { accessToken: data.access_token };
    } catch (error) {
      console.error('Error refreshing Spotify token:', error);
      return { error };
    }
  }

  async getUserAccessToken(
    userId: string
  ): Promise<{ accessToken?: string; error?: any }> {
    try {
      // First, get the user's profile to check token expiration
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('spotify_token_expires_at, spotify_connected')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile?.spotify_connected) {
        return { error: 'User not connected to Spotify' };
      }

      // Check if token is expired
      const expiresAt = new Date(profile.spotify_token_expires_at || 0);
      const now = new Date();

      if (expiresAt <= now) {
        // Token is expired, refresh it
        return await this.refreshUserToken(userId);
      }

      // Get decrypted access token from secure storage
      const { data: tokens, error: tokensError } =
        await supabase.functions.invoke('secure-tokens', {
          body: {
            action: 'retrieve',
            userId,
          },
        });

      if (tokensError || !tokens?.accessToken) {
        return { error: 'No access token found' };
      }

      return { accessToken: tokens.accessToken };
    } catch (error) {
      console.error('Error getting user access token:', error);
      return { error };
    }
  }

  // Web Playback SDK methods
  async initializeWebPlayback(
    accessToken: string
  ): Promise<Spotify.Player | null> {
    return new Promise(resolve => {
      // Load Spotify Web Playback SDK
      if (!window.Spotify) {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;

        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
          this.createPlayer(accessToken, resolve);
        };
      } else {
        this.createPlayer(accessToken, resolve);
      }
    });
  }

  private createPlayer(
    accessToken: string,
    resolve: (player: Spotify.Player | null) => void
  ) {
    const player = new window.Spotify.Player({
      name: 'Force Majeure Web Player',
      getOAuthToken: (cb: (token: string) => void) => {
        cb(accessToken);
      },
      volume: 0.5,
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => {
      console.error('Failed to initialize:', message);
      resolve(null);
    });

    player.addListener('authentication_error', ({ message }) => {
      console.error('Failed to authenticate:', message);
      resolve(null);
    });

    player.addListener('account_error', ({ message }) => {
      console.error('Failed to validate Spotify account:', message);
      resolve(null);
    });

    player.addListener('playback_error', ({ message }) => {
      console.error('Failed to perform playback:', message);
    });

    // Ready
    player.addListener('ready', ({ device_id }) => {
      if (import.meta.env.DEV) {
        console.log('Ready with Device ID', device_id);
      }
      resolve(player);
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
      if (import.meta.env.DEV) {
        console.log('Device ID has gone offline', device_id);
      }
    });

    // Connect to the player!
    player.connect();
  }

  async playTrack(
    player: Spotify.Player,
    trackUri: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      // Get the device ID
      const state = await player.getCurrentState();
      if (!state) {
        console.error('User is not playing music through the Web Playback SDK');
        return false;
      }

      // Use Spotify Web API to start playback
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${state.device_id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            uris: [trackUri],
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error playing track:', error);
      return false;
    }
  }
}

// Extend window interface for Spotify Web Playback SDK
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => Spotify.Player;
    };
  }
}

declare namespace Spotify {
  interface Player {
    addListener(event: string, callback: (data: any) => void): void;
    connect(): Promise<boolean>;
    disconnect(): void;
    getCurrentState(): Promise<any>;
    getVolume(): Promise<number>;
    nextTrack(): Promise<void>;
    pause(): Promise<void>;
    previousTrack(): Promise<void>;
    resume(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    setName(name: string): Promise<void>;
    setVolume(volume: number): Promise<void>;
    togglePlay(): Promise<void>;
  }
}

export const enhancedSpotifyService = EnhancedSpotifyService.getInstance();
