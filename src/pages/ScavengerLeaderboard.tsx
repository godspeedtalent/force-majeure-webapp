import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Trophy, MapPin } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { LocationCard } from '@/components/scavenger/LocationCard';
import { LeaderboardTable } from '@/components/scavenger/LeaderboardTable';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import lfSystemImage from '@/assets/lf-system-scavenger.jpg';


export default function ScavengerLeaderboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all locations with progress
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['scavenger-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scavenger_locations')
        .select('*')
        .eq('is_active', true)
        .order('location_name');

      if (error) throw error;
      return data;
    }
  });

  // Fetch leaderboard entries (only users who opted in)
  const { data: leaderboardEntries, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['scavenger-leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scavenger_claims')
        .select(`
          id,
          claim_position,
          claimed_at,
          profiles!inner(display_name),
          scavenger_locations!inner(location_name)
        `)
        .eq('show_on_leaderboard', true)
        .order('claimed_at', { ascending: true });

      if (error) throw error;

      return data.map(entry => ({
        id: entry.id,
        display_name: (entry.profiles as any).display_name,
        location_name: (entry.scavenger_locations as any).location_name,
        claim_position: entry.claim_position,
        claimed_at: entry.claimed_at
      }));
    }
  });

  // Fetch user's claims (if logged in)
  const { data: userClaims } = useQuery({
    queryKey: ['user-scavenger-claims', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('scavenger_claims')
        .select(`
          id,
          claim_position,
          reward_type,
          promo_code,
          claimed_at,
          scavenger_locations!inner(location_name)
        `)
        .eq('user_id', user.id)
        .order('claimed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  if (locationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-fm-gold" />
      </div>
    );
  }

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36).slice(-12),
        options: {
          data: {
            display_name: displayName,
            show_on_leaderboard: showOnLeaderboard
          }
        }
      });

      if (error) throw error;

      toast.success('Check your email to complete registration!');
      setIsJoinModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show error state if no token
  if (!token) {
    return (
      <div className="min-h-screen flex">
        {/* Left Column - Content */}
        <div className="w-1/2 flex items-center justify-center overflow-y-auto relative border-r border-border">
          <div className="absolute inset-0 bg-topographic opacity-25 bg-repeat bg-center" />
          <div className="w-full max-w-md px-8 py-12 relative z-10">
            <div className="bg-background/80 backdrop-blur-md border border-border rounded-2xl p-8 text-center">
              <h1 className="font-display text-5xl md:text-6xl mb-4">
                You got here too early.
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                But the free tickets are still out there. Keep searching!
              </p>
              
              <div className="space-y-6">
                <h2 className="font-display text-2xl md:text-3xl text-fm-gold">
                  Register for the Rave Fam
                </h2>
                <p className="text-lg text-muted-foreground">
                  You'll need to join the rave fam to snag the free tix once you find them. You can get a head start now.
                </p>
                <Button 
                  size="lg" 
                  className="w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 text-primary font-semibold"
                  onClick={() => setIsJoinModalOpen(true)}
                >
                  Join
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Image */}
        <div className="w-1/2 bg-muted relative overflow-hidden">
          <img 
            src={lfSystemImage} 
            alt="LF System" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/5 backdrop-blur-[0.5px]" />
        </div>

        {/* Join Modal */}
        <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-3xl">Join the Rave Fam</DialogTitle>
              <DialogDescription>
                Register to claim your free tickets when you find them.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="leaderboard"
                  checked={showOnLeaderboard}
                  onCheckedChange={(checked) => setShowOnLeaderboard(checked as boolean)}
                />
                <Label htmlFor="leaderboard" className="text-sm cursor-pointer">
                  Show me on the leaderboard
                </Label>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-gold hover:opacity-90 text-primary font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Joining...' : 'Join Now'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Content */}
      <div className="w-1/2 flex items-center justify-center overflow-y-auto relative border-r border-border">
        <div className="absolute inset-0 bg-topographic opacity-25 bg-repeat bg-center" />
        <div className="w-full max-w-3xl px-8 py-12 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl mb-4">
              <span className="text-fm-gold">LF System</span> Scavenger Hunt
            </h1>
            <p className="text-lg text-muted-foreground">
              Find all 5 locations to complete the hunt!
            </p>
          </div>

          <Tabs defaultValue="locations" className="space-y-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="locations" className="gap-2">
                <MapPin className="w-4 h-4" />
                Locations
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-2">
                <Trophy className="w-4 h-4" />
                Leaderboard
              </TabsTrigger>
            </TabsList>

            {/* Locations Tab */}
            <TabsContent value="locations" className="space-y-8">
              <div className="grid gap-4 md:grid-cols-2">
                {locations?.map((location) => (
                  <LocationCard
                    key={location.id}
                    locationName={location.location_name}
                    rewardType={location.reward_type}
                    totalTokens={location.total_tokens}
                    tokensRemaining={location.tokens_remaining}
                  />
                ))}
              </div>

              {/* User's stats */}
              {user && userClaims && userClaims.length > 0 && (
                <Card className="p-6 bg-gradient-gold border-none text-primary-foreground">
                  <h3 className="font-display text-2xl mb-4">Your Progress</h3>
                  <div className="space-y-3">
                    <p className="text-lg">
                      You've found <span className="font-bold">{userClaims.length}</span> of 5 locations!
                    </p>
                    <div className="space-y-2">
                      {userClaims.map((claim) => (
                        <div key={claim.id} className="flex items-center justify-between bg-primary-foreground/10 rounded-lg p-3">
                          <span className="font-medium">
                            {(claim.scavenger_locations as any).location_name}
                          </span>
                          <span className="text-sm">
                            Position #{claim.claim_position}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard">
              {leaderboardLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-fm-gold" />
                </div>
              ) : (
                <div>
                  <div className="text-center mb-6">
                    <h2 className="font-display text-2xl mb-2">Top Hunters</h2>
                    <p className="text-sm text-muted-foreground">
                      Only showing users who opted in to the leaderboard
                    </p>
                  </div>
                  <LeaderboardTable entries={leaderboardEntries || []} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Column - Image */}
      <div className="w-1/2 bg-muted relative overflow-hidden">
        <img 
          src={lfSystemImage} 
          alt="LF System" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/5 backdrop-blur-[0.5px]" />
      </div>
    </div>
  );
}
