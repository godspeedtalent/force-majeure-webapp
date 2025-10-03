import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { validateScavengerToken } from '@/lib/scavengerApi';
import { useScavengerClaim } from '@/hooks/useScavengerClaim';
import { RewardPreview } from '@/components/scavenger/RewardPreview';
import { ClaimSuccessModal } from '@/components/scavenger/ClaimSuccessModal';
import { Button } from '@/components/ui/button';
import { CustomInput } from '@/components/ui/custom-input';
import { Checkbox } from '@/components/ui/checkbox';
import { CustomLabel } from '@/components/ui/custom-label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { ValidationResult } from '@/lib/scavengerApi';

export default function ScavengerSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signUp } = useAuth();
  const { data: flags } = useFeatureFlags();
  const { claim, loading: claimLoading, result: claimResult } = useScavengerClaim();

  const [validating, setValidating] = useState(true);
  const [tokenData, setTokenData] = useState<ValidationResult | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error('No token provided');
      navigate('/');
      return;
    }

    const validateToken = async () => {
      setValidating(true);
      const result = await validateScavengerToken(token);
      
      if (!result.valid) {
        toast.error(result.message || 'Invalid token');
        navigate('/');
        return;
      }

      setTokenData(result);
      setValidating(false);
    };

    validateToken();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !tokenData) return;

    setSubmitting(true);

    try {
      // If user is already logged in, just claim
      if (user) {
        await claim(token, user.email!, displayName || user.email!, showOnLeaderboard);
        return;
      }

      // Sign up new user
      const { error: signUpError } = await signUp(email, password, displayName);
      
      if (signUpError) {
        toast.error(signUpError.message);
        setSubmitting(false);
        return;
      }

      // Wait a moment for auth to process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Claim reward
      await claim(token, email, displayName, showOnLeaderboard);
    } catch (error: any) {
      console.error('Signup/claim error:', error);
      toast.error('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  // Check if scavenger hunt is active
  if (!flags?.scavenger_hunt_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-fm-gold mx-auto mb-4" />
          <h2 className="font-display text-2xl mb-2">Scavenger Hunt Not Active</h2>
          <p className="text-muted-foreground mb-6">
            The scavenger hunt is currently not running. Check back later!
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-fm-gold mx-auto mb-4" />
          <p className="text-muted-foreground">Validating your reward...</p>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-2xl mb-2">Invalid Token</h2>
          <p className="text-muted-foreground">
            This reward link is not valid. Please check your QR code.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-topographic opacity-5 bg-repeat bg-center" />
      
      <div className="relative max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl mb-2">
            You Found It! 🎉
          </h1>
          <p className="text-muted-foreground">
            Claim your exclusive LF System reward
          </p>
        </div>

        {/* Reward preview */}
        <div className="mb-8">
          <RewardPreview
            locationName={tokenData.location_name!}
            rewardType={tokenData.reward_type!}
            tokensRemaining={tokenData.tokens_remaining!}
            totalTokens={tokenData.total_tokens!}
          />
        </div>

        {/* Signup form */}
        <Card className="p-8">
          <h2 className="font-display text-2xl mb-6">
            {user ? 'Claim Your Reward' : 'Sign Up to Claim'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!user && (
              <>
                <div>
                  <CustomLabel htmlFor="email">Email</CustomLabel>
                  <CustomInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <CustomLabel htmlFor="password">Password</CustomLabel>
                  <CustomInput
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </>
            )}

            <div>
              <CustomLabel htmlFor="displayName">Display Name</CustomLabel>
              <CustomInput
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="How should we call you?"
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
              <Checkbox
                id="leaderboard"
                checked={showOnLeaderboard}
                onCheckedChange={(checked) => setShowOnLeaderboard(checked === true)}
              />
              <div className="flex-1">
                <label
                  htmlFor="leaderboard"
                  className="text-sm font-medium cursor-pointer"
                >
                  Show me on the leaderboard
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Let others see that you found this location
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || claimLoading}
              className="w-full bg-gradient-gold hover:opacity-90 text-primary-foreground font-display text-lg py-6"
            >
              {submitting || claimLoading ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  {user ? 'Claiming...' : 'Signing up...'}
                </>
              ) : (
                user ? 'Claim Reward' : 'Sign Up & Claim'
              )}
            </Button>
          </form>
        </Card>
      </div>

      {/* Success modal */}
      {claimResult?.success && (
        <ClaimSuccessModal
          open={true}
          claimPosition={claimResult.claim_position!}
          locationName={claimResult.location_name!}
          rewardType={claimResult.reward_type!}
          promoCode={claimResult.promo_code!}
          onClose={() => navigate('/scavenger-leaderboard')}
        />
      )}
    </div>
  );
}
