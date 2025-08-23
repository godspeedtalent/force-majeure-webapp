import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { enhancedSpotifyService } from '@/lib/enhancedSpotify';
import { Button } from '@/components/ui/button';
import { CustomInput } from '@/components/ui/custom-input';
import { CustomLabel } from '@/components/ui/custom-label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SplitPageLayout } from '@/components/SplitPageLayout';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Music, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Profile = () => {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isConnectingSpotify, setIsConnectingSpotify] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
    }
  }, [profile]);

  // Handle Spotify OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      toast({
        title: "Spotify connection failed",
        description: "Authorization was cancelled or failed.",
        variant: "destructive"
      });
      navigate('/profile', { replace: true });
      return;
    }

    if (code && state && user?.id === state) {
      handleSpotifyCallback(code);
    }
  }, [searchParams, user]);

  const handleSpotifyCallback = async (code: string) => {
    if (!user) return;
    
    setIsConnectingSpotify(true);
    
    try {
      const redirectUri = `${window.location.origin}/profile`;
      const result = await enhancedSpotifyService.exchangeCodeForTokens(code, redirectUri, user.id);
      
      if (result.success) {
        await refreshProfile();
        toast({
          title: "Spotify connected!",
          description: "You can now stream full tracks from Spotify."
        });
      } else {
        toast({
          title: "Connection failed",
          description: "Failed to connect to Spotify. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error handling Spotify callback:', error);
      toast({
        title: "Connection failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnectingSpotify(false);
      navigate('/profile', { replace: true });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await updateProfile({ display_name: displayName });
    setIsLoading(false);
  };

  const handleConnectSpotify = async () => {
    if (!user) return;
    
    setIsConnectingSpotify(true);
    
    try {
      const redirectUri = `${window.location.origin}/profile`;
      const authUrl = await enhancedSpotifyService.getAuthUrl(redirectUri, user.id);
      
      // Redirect to Spotify authorization
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      toast({
        title: "Connection failed",
        description: "Failed to connect to Spotify. Please try again.",
        variant: "destructive"
      });
      setIsConnectingSpotify(false);
    }
  };

  if (!user) {
    return (
      <SplitPageLayout
        left={
          <div className="h-full flex items-center justify-center p-8">
            <p className="text-muted-foreground">Please sign in to view your profile.</p>
          </div>
        }
        right={<div />}
        leftDecor={true}
      />
    );
  }

  const leftPane = (
    <div className="h-full flex flex-col justify-center p-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-canela font-medium text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and streaming preferences
        </p>
      </div>
    </div>
  );

  const rightPane = (
    <div className="p-8 space-y-8">
      {/* Profile Information Row */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-canela font-medium text-foreground mb-2">Profile Information</h2>
          <p className="text-sm text-muted-foreground">Update your display name and other profile details</p>
        </div>
        
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <CustomLabel htmlFor="email">Email</CustomLabel>
              <CustomInput
                id="email"
                type="email"
                value={user.email || ''}
                disabled
                className="opacity-60"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <CustomLabel htmlFor="displayName">Display Name</CustomLabel>
              <CustomInput
                id="displayName"
                type="text"
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="bg-fm-gold hover:bg-fm-gold/90 text-black font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Update Profile
          </Button>
        </form>
      </div>

      <Separator />

      {/* Spotify Integration Row */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Music className="w-5 h-5 text-fm-gold" />
          <div>
            <h2 className="text-xl font-canela font-medium text-foreground">Spotify Integration</h2>
            <p className="text-sm text-muted-foreground">Connect your Spotify Premium account to stream full tracks</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Connection Status:</span>
              {profile?.spotify_connected ? (
                <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="border-destructive/20 text-destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>
          </div>

          {!profile?.spotify_connected ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Benefits of connecting Spotify:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Stream full tracks instead of 30-second previews</li>
                  <li>• Access your personal Spotify library</li>
                  <li>• Enhanced playback controls</li>
                  <li>• Seamless cross-device experience</li>
                </ul>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  <strong>Note:</strong> Spotify Premium account required for full track streaming.
                </p>
              </div>

              <Button
                onClick={handleConnectSpotify}
                className="bg-green-500 hover:bg-green-600 text-white font-medium"
                disabled={isConnectingSpotify}
              >
                {isConnectingSpotify ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Connect to Spotify
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Your Spotify account is connected and ready to use!
                </p>
              </div>

              <div className="text-xs text-muted-foreground">
                You can now enjoy full track streaming throughout the app.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <SplitPageLayout
      left={leftPane}
      right={rightPane}
      leftDecor={true}
      leftWidthClass="w-full lg:w-1/3"
      rightWidthClass="hidden lg:block w-2/3"
    />
  );
};

export default Profile;