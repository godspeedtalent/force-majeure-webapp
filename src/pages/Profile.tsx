import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { enhancedSpotifyService } from '@/lib/enhancedSpotify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/Layout';
import { PageTransition } from '@/components/PageTransition';
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
      <Layout>
        <PageTransition>
          <div className="min-h-screen flex items-center justify-center">
            <p>Please sign in to view your profile.</p>
          </div>
        </PageTransition>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-fm-gold/5 py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-canela font-bold text-foreground">Profile Settings</h1>
                <p className="text-muted-foreground mt-2">
                  Manage your account settings and streaming preferences
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Information */}
                <Card className="border-border/50 bg-card/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your display name and other profile details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user.email || ''}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          type="text"
                          placeholder="Enter your display name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-fm-gold hover:bg-fm-gold/90 text-black font-medium"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Update Profile
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Spotify Integration */}
                <Card className="border-border/50 bg-card/95 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      Spotify Integration
                    </CardTitle>
                    <CardDescription>
                      Connect your Spotify Premium account to stream full tracks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
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

                    <Separator />

                    {!profile?.spotify_connected ? (
                      <div className="space-y-3">
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
                          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium"
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
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
};

export default Profile;