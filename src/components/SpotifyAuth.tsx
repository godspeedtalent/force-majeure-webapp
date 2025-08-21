import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SpotifyService } from '@/lib/spotify';
import { Music, ExternalLink } from 'lucide-react';

interface SpotifyAuthProps {
  onAuthSuccess?: () => void;
}

export const SpotifyAuth: React.FC<SpotifyAuthProps> = ({ onAuthSuccess }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const spotifyService = SpotifyService.getInstance();

  useEffect(() => {
    setIsAuthenticated(spotifyService.isAuthenticated());
    
    // Check for auth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      handleAuthCallback(code, state);
    }
  }, []);

  const handleAuthCallback = async (code: string, state: string) => {
    setIsLoading(true);
    try {
      const success = await spotifyService.handleAuthCallback(code, state);
      if (success) {
        setIsAuthenticated(true);
        onAuthSuccess?.();
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        console.error('Failed to authenticate with Spotify');
      }
    } catch (error) {
      console.error('Error handling auth callback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const authUrl = await spotifyService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Spotify auth:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    spotifyService.logout();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Music className="w-4 h-4 animate-pulse" />
        <span>Connecting to Spotify...</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-2 text-green-500">
          <Music className="w-4 h-4" />
          <span>Spotify Connected</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="text-xs"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleLogin}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Music className="w-4 h-4" />
      Connect Spotify
      <ExternalLink className="w-3 h-3" />
    </Button>
  );
};