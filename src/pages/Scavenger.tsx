import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { LocationCard } from '@/components/scavenger/LocationCard';
import { LoadingState } from '@/components/LoadingState';
import { MessagePanel } from '@/components/MessagePanel';
import { WizardPanel, useWizardNavigation } from '@/components/WizardPanel';
import { ImageWithSkeleton } from '@/components/ImageWithSkeleton';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { ScavengerNavigation } from '@/components/ScavengerNavigation';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { ScavengerDevPanel } from '@/components/ScavengerDevPanel';
import lfSystemImage from '@/assets/lf-system-scavenger.jpg';


export default function Scavenger() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { data: featureFlags } = useFeatureFlags();
  const { currentStep, setCurrentStep, nextStep } = useWizardNavigation();
  
  const parallaxRef1 = useRef<HTMLDivElement>(null);
  const parallaxRef2 = useRef<HTMLDivElement>(null);
  const parallaxRef3 = useRef<HTMLDivElement>(null);
  const autoScrollCancelled = useRef(false);
  
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Auto-scroll animation on mount
  useEffect(() => {
    const targetScroll = window.innerHeight * 0.25; // 25% of viewport
    const duration = 3000; // 3 seconds
    const startTime = Date.now();
    let animationFrame: number;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = () => {
      if (autoScrollCancelled.current) return;

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      window.scrollTo(0, targetScroll * easedProgress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    // Start animation after a brief delay
    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 300);

    // Cancel on user scroll
    const handleUserScroll = () => {
      autoScrollCancelled.current = true;
      cancelAnimationFrame(animationFrame);
    };

    window.addEventListener('wheel', handleUserScroll, { once: true, passive: true });
    window.addEventListener('touchstart', handleUserScroll, { once: true, passive: true });

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('wheel', handleUserScroll);
      window.removeEventListener('touchstart', handleUserScroll);
    };
  }, []);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      [parallaxRef1, parallaxRef2, parallaxRef3].forEach(ref => {
        if (ref.current) {
          ref.current.style.transform = `translateY(${scrollY * 0.5}px)`;
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Validate token when present
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidationResult(null);
        return;
      }

      setIsValidating(true);
      try {
        const { data, error } = await supabase.functions.invoke('validate-scavenger-token', {
          body: { token }
        });

        if (error) throw error;
        setValidationResult(data);
      } catch (error) {
        console.error('Token validation error:', error);
        setValidationResult({ valid: false, error: 'Failed to validate token' });
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const claim = useMutation({
    mutationFn: async (params: {
      token: string;
      userEmail: string;
      displayName: string;
      showOnLeaderboard: boolean;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Create device fingerprint
      const userAgent = navigator.userAgent;
      const language = navigator.language;
      const platform = navigator.platform;
      const screenResolution = `${window.screen.width}x${window.screen.height}`;
      const deviceFingerprint = `${userAgent}::${language}::${platform}::${screenResolution}`;

      const { data, error } = await supabase.functions.invoke('claim-scavenger-reward', {
        body: { 
          token: params.token, 
          user_email: params.userEmail,
          display_name: params.displayName,
          show_on_leaderboard: params.showOnLeaderboard,
          device_fingerprint: deviceFingerprint
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      return data;
    }
  });
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [agreeToContact, setAgreeToContact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if all required fields are filled
  const isFormValid = fullName.trim() !== '' && 
                       email.trim() !== '' && 
                       displayName.trim() !== '' && 
                       phoneNumber.trim() !== '' &&
                       agreeToContact;

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
        <LoadingState />
      </div>
    );
  }

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Build redirect URL to preserve token if it exists
      const currentUrl = window.location.origin + window.location.pathname;
      const redirectUrl = token ? `${currentUrl}?token=${token}` : currentUrl;

      const { error } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36).slice(-12),
        options: {
          data: {
            display_name: displayName,
            full_name: fullName,
            phone_number: phoneNumber,
            instagram_handle: instagramHandle,
            show_on_leaderboard: showOnLeaderboard,
          },
          emailRedirectTo: redirectUrl,
        }
      });

      if (error) throw error;

      toast.success('Verification email sent');
      setCurrentStep(2); // Go to confirmation step
    } catch (error: any) {
      toast.error(error.message || 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      toast.success('Successfully logged in!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Calculate total unclaimed rewards
  const totalUnclaimedRewards = locations?.reduce((sum, location) => sum + location.tokens_remaining, 0) || 0;

  // Handle token validation states
  if (token && validationResult) {
    // State 1: Invalid Token
    if (!validationResult.valid) {
      return (
        <>
          <ScavengerNavigation showShoppingCart={!featureFlags?.coming_soon_mode} />
          {/* Mobile/Tablet: Hero image at top */}
          <div className="lg:hidden h-[50vh] w-full bg-muted relative overflow-hidden shadow-[0_12px_48px_-4px_rgba(0,0,0,0.7)]">
            <div 
              ref={parallaxRef1}
              className="absolute inset-0 w-full h-[120%] -top-[10%]"
              style={{ willChange: 'transform' }}
            >
              <ImageWithSkeleton 
                src={lfSystemImage} 
                alt="LF System" 
                className="w-full h-full object-cover object-top brightness-90"
              />
            </div>
          </div>
          {/* Desktop: Split layout */}
          <div className="min-h-screen flex flex-col lg:flex-row">
            <div className="flex-1 lg:w-1/2 flex items-center justify-center lg:overflow-y-auto relative z-10 lg:shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)] lg:border-r border-border">
              <div className="absolute inset-0 bg-topographic opacity-15 lg:opacity-25 bg-no-repeat bg-cover bg-center backdrop-blur-sm" />
              <div className="w-full max-w-md px-4 py-6 lg:px-8 lg:py-12 relative z-10">
                <MessagePanel 
                  title="Invalid Token"
                  description="This QR code doesn't seem to be valid. Please try scanning it again."
                  className="mb-4"
                />
                <div className="text-center space-y-3 text-sm lg:text-base">
                  <p className="text-foreground font-canela">
                    If you keep having issues, take a photo of the poster with your hand holding up 3 fingers next to it.
                  </p>
                  <p className="text-foreground font-canela">
                    Send that photo in a DM to{' '}
                    <a 
                      href="https://www.instagram.com/force.majeure.events/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-fm-gold hover:underline"
                    >
                      @force.majeure.events
                    </a>
                    {' '}on Instagram.
                  </p>
                </div>
              </div>
            </div>
            {/* Desktop only: Right side image */}
            <div className="hidden lg:block lg:w-1/2 bg-muted relative overflow-hidden">
              <ImageWithSkeleton 
                src={lfSystemImage} 
                alt="LF System" 
                className="w-full h-full object-cover brightness-90"
              />
            </div>
          </div>
          <Footer />
          <ScavengerDevPanel />
        </>
      );
    }

    // Check if already claimed by checking user's claims
    const alreadyClaimed = userClaims?.some(
      claim => claim.scavenger_locations?.location_name === validationResult.location_name
    );

    // State 2: Already Claimed
    if (alreadyClaimed) {
      return (
        <>
          <ScavengerNavigation showShoppingCart={!featureFlags?.coming_soon_mode} />
          {/* Mobile/Tablet: Hero image at top */}
          <div className="lg:hidden h-[50vh] w-full bg-muted relative overflow-hidden shadow-[0_12px_48px_-4px_rgba(0,0,0,0.7)]">
            <div 
              ref={parallaxRef2}
              className="absolute inset-0 w-full h-[120%] -top-[10%]"
              style={{ willChange: 'transform' }}
            >
              <ImageWithSkeleton 
                src={lfSystemImage} 
                alt="LF System" 
                className="w-full h-full object-cover object-top brightness-90"
              />
            </div>
          </div>
          {/* Desktop: Split layout */}
          <div className="min-h-screen flex flex-col lg:flex-row">
            <div className="flex-1 lg:w-1/2 flex items-center justify-center lg:overflow-y-auto relative z-10 lg:shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)] lg:border-r border-border">
              <div className="absolute inset-0 bg-topographic opacity-15 lg:opacity-25 bg-no-repeat bg-cover bg-center backdrop-blur-sm" />
              <div className="w-full max-w-md px-4 py-6 lg:px-8 lg:py-12 relative z-10">
                <MessagePanel 
                  title="Already Claimed!"
                  description={`You've already claimed a reward from ${validationResult.location_name}. You can only claim one reward per location!`}
                  className="mb-4"
                />
                <div className="text-center">
                  <p className="text-foreground font-canela text-sm lg:text-lg">
                    But you can share this secret location with your friends! 🎉
                  </p>
                </div>
              </div>
            </div>
            {/* Desktop only: Right side image */}
            <div className="hidden lg:block lg:w-1/2 bg-muted relative overflow-hidden">
              <ImageWithSkeleton 
                src={lfSystemImage} 
                alt="LF System" 
                className="w-full h-full object-cover brightness-90"
              />
            </div>
          </div>
          <Footer />
          <ScavengerDevPanel />
        </>
      );
    }

    // State 3: Valid unclaimed token
    if (validationResult.tokens_remaining <= 0) {
      return (
        <>
          <ScavengerNavigation showShoppingCart={!featureFlags?.coming_soon_mode} />
          {/* Mobile/Tablet: Hero image at top */}
          <div className="lg:hidden h-[50vh] w-full bg-muted relative overflow-hidden shadow-[0_12px_48px_-4px_rgba(0,0,0,0.7)]">
            <div 
              ref={parallaxRef3}
              className="absolute inset-0 w-full h-[120%] -top-[10%]"
              style={{ willChange: 'transform' }}
            >
              <ImageWithSkeleton 
                src={lfSystemImage} 
                alt="LF System" 
                className="w-full h-full object-cover object-top brightness-90"
              />
            </div>
          </div>
          {/* Desktop: Split layout */}
          <div className="min-h-screen flex flex-col lg:flex-row">
            <div className="flex-1 lg:w-1/2 flex items-center justify-center lg:overflow-y-auto relative z-10 lg:shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)] lg:border-r border-border">
              <div className="absolute inset-0 bg-topographic opacity-15 lg:opacity-25 bg-no-repeat bg-cover bg-center backdrop-blur-sm" />
              <div className="w-full max-w-md px-4 py-6 lg:px-8 lg:py-12 relative z-10">
                <MessagePanel 
                  title="All Claimed!"
                  description={`All rewards from ${validationResult.location_name} have been claimed. Try finding another location!`}
                  className="mb-4"
                />
              </div>
            </div>
            {/* Desktop only: Right side image */}
            <div className="hidden lg:block lg:w-1/2 bg-muted relative overflow-hidden">
              <ImageWithSkeleton 
                src={lfSystemImage} 
                alt="LF System" 
                className="w-full h-full object-cover brightness-90"
              />
            </div>
          </div>
          <Footer />
          <ScavengerDevPanel />
        </>
      );
    }

    // Valid unclaimed token - show reward and claim flow
    if (!user) {
      // Not authenticated - show wizard to join
      const wizardSteps = [
        {
          content: (
            <MessagePanel
              isLoading={locationsLoading}
              title="🎉 Reward Found!"
              description={`You found ${validationResult.location_name}! You're eligible for: ${validationResult.reward_type || 'an exclusive reward'}`}
              action={
                <>
                  <p className="text-lg text-muted-foreground mb-6">
                    Join the rave fam to claim your reward!
                  </p>
                  <Button 
                    size="lg" 
                    className="w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                    onClick={nextStep}
                  >
                    Join
                  </Button>
                  <Button 
                    size="lg" 
                    className="w-full max-w-xs mx-auto mt-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                    onClick={() => setIsLoginMode(true)}
                  >
                    Sign In
                  </Button>
                </>
              }
            />
          ),
          canGoBack: false,
        },
        {
          content: (
            <div className="bg-background/60 backdrop-blur-md border-2 border-border/40 p-12 w-full shadow-2xl animate-slide-up-fade">
              <div className="mb-6 text-center">
                <h1 className="font-display text-3xl md:text-4xl mb-2">Join the Rave Fam</h1>
                <p className="text-muted-foreground">
                  Register to claim your reward.
                </p>
              </div>
              <form onSubmit={handleJoinSubmit} className="space-y-8">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name <span className="text-fm-gold">*</span></Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-fm-gold">*</span></Label>
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
                    <Label htmlFor="displayName">Display Name <span className="text-fm-gold">*</span></Label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Your display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number <span className="text-fm-gold">*</span></Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagramHandle">Instagram Handle</Label>
                    <Input
                      id="instagramHandle"
                      type="text"
                      placeholder="@yourhandle"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showOnLeaderboard"
                      checked={showOnLeaderboard}
                      onCheckedChange={(checked) => setShowOnLeaderboard(checked as boolean)}
                    />
                    <label htmlFor="showOnLeaderboard" className="text-sm">
                      Show my name on the leaderboard
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreeToContact"
                      checked={agreeToContact}
                      onCheckedChange={(checked) => setAgreeToContact(checked as boolean)}
                    />
                    <label htmlFor="agreeToContact" className="text-sm">
                      I agree to receive event updates via email and SMS <span className="text-fm-gold">*</span>
                    </label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                  disabled={isSubmitting || !isFormValid}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </form>
            </div>
          ),
          canGoBack: true,
        },
        {
          content: (
            <MessagePanel
              title="Check Your Email"
              description={`We've sent a verification link to ${email}. Click the link to verify your account and claim your reward!`}
            />
          ),
          canGoBack: false,
        }
      ];

      return (
        <>
          <ScavengerNavigation showShoppingCart={!featureFlags?.coming_soon_mode} />
          <div className="min-h-screen flex">
            <div className="w-1/2 flex items-center justify-center overflow-y-auto relative z-10 shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)] border-r border-border">
              <div className="absolute inset-0 bg-topographic opacity-25 bg-no-repeat bg-cover bg-center backdrop-blur-sm" />
              <div className="w-full max-w-md px-8 py-12 relative z-10">
                {isLoginMode ? (
                  <div className="w-full">
                    <Button
                      variant="ghost"
                      onClick={() => setIsLoginMode(false)}
                      className="mb-4 text-muted-foreground hover:text-foreground"
                    >
                      ← Back
                    </Button>
                    
                    <div className="bg-background/60 backdrop-blur-md border-2 border-border/40 p-12 w-full shadow-2xl">
                      <div className="mb-6 text-center">
                        <h1 className="font-display text-3xl md:text-4xl mb-2">Welcome Back</h1>
                        <p className="text-muted-foreground">
                          Sign in to claim your reward
                        </p>
                      </div>
                      
                      <form onSubmit={handleLoginSubmit} className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="loginEmail">Email <span className="text-fm-gold">*</span></Label>
                          <Input
                            id="loginEmail"
                            type="email"
                            placeholder="your@email.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="loginPassword">Password <span className="text-fm-gold">*</span></Label>
                          <Input
                            id="loginPassword"
                            type="password"
                            placeholder="Enter your password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                          />
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                          disabled={isLoggingIn}
                        >
                          {isLoggingIn ? 'Signing In...' : 'Sign In'}
                        </Button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <WizardPanel
                    steps={wizardSteps}
                    currentStep={currentStep}
                    onStepChange={setCurrentStep}
                  />
                )}
              </div>
            </div>
            <div className="w-1/2 bg-muted relative overflow-hidden">
              <ImageWithSkeleton 
                src={lfSystemImage} 
                alt="LF System" 
                className="w-full h-full object-cover brightness-90"
              />
            </div>
          </div>
          <Footer />
          <ScavengerDevPanel />
        </>
      );
    }

    // Authenticated - show claim button
    return (
      <>
        <ScavengerNavigation showShoppingCart={!featureFlags?.coming_soon_mode} />
        <div className="min-h-screen flex">
          <div className="w-1/2 flex items-center justify-center overflow-y-auto relative z-10 shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)] border-r border-border">
            <div className="absolute inset-0 bg-topographic opacity-25 bg-no-repeat bg-cover bg-center backdrop-blur-sm" />
            <div className="w-full max-w-md px-8 py-12 relative z-10">
              <MessagePanel 
                title="🎉 Ready to Claim!"
                description={`${validationResult.location_name} - ${validationResult.reward_type || 'Exclusive Reward'}`}
                className="mb-6"
              />
              <div className="text-center">
                <Button
                  size="lg"
                  className="bg-gradient-gold hover:opacity-90 font-screamer text-xl px-12 py-6 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.6)]"
                  onClick={async () => {
                    if (!profile?.display_name || !user?.email) return;
                    
                    const result = await claim.mutateAsync({
                      token: token!,
                      userEmail: user.email,
                      displayName: profile.display_name,
                      showOnLeaderboard: true
                    });

                    if (result.success) {
                      toast.success('Reward claimed! Check your email for the promo code.');
                      window.location.href = '/scavenger';
                    } else {
                      toast.error(result.error || 'Failed to claim reward');
                    }
                  }}
                  disabled={claim.isPending}
                >
                  {claim.isPending ? 'Claiming...' : 'Claim Reward'}
                </Button>
              </div>
            </div>
          </div>
          <div className="w-1/2 bg-muted relative overflow-hidden">
            <ImageWithSkeleton 
              src={lfSystemImage} 
              alt="LF System" 
              className="w-full h-full object-cover brightness-90"
            />
          </div>
        </div>
        <Footer />
        <ScavengerDevPanel />
      </>
    );
  }

  // Show authenticated state without token
  if (user && !token) {
    return (
      <>
        <ScavengerNavigation showShoppingCart={!featureFlags?.coming_soon_mode} />
        <div className="min-h-screen flex">
          {/* Left Column - Content */}
          <div className="w-1/2 flex items-center justify-center overflow-y-auto relative z-10 shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)] border-r border-border">
            <div className="absolute inset-0 bg-topographic opacity-25 bg-no-repeat bg-cover bg-center backdrop-blur-sm" />
            <div className="w-full max-w-md px-8 py-12 relative z-10 flex items-center justify-center">
              <MessagePanel
                isLoading={locationsLoading}
                title={`Welcome back, ${profile?.display_name || 'Raver'}!`}
                description="Ready to claim your free tickets? Head out and scan a QR code at one of the locations."
                action={
                  <>
                    <div className="text-center mb-8">
                      {totalUnclaimedRewards > 0 ? (
                        <>
                          <p className="text-lg text-muted-foreground mb-4">
                            Unclaimed Rewards
                          </p>
                          <AnimatedCounter value={totalUnclaimedRewards} />
                        </>
                      ) : (
                        <>
                          <p className="text-xl text-muted-foreground mb-6">
                            Everything's been claimed! Tickets are still available below:
                          </p>
                          <Button 
                            size="lg" 
                            className="bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                            asChild
                          >
                            <a 
                              href="https://www.etix.com/ticket/p/45040939/lf-system-austin-kingdom-nightclub?partner_id=100&_gl=1*1nkxwlr*_gcl_au*ODMxOTAwNDA1LjE3NTMxMDk5NzU.*_ga*MTYzNTgzMjU4MS4xNzUzMTA5OTc1*_ga_FE6TSQF71T*czE3NTYyMjUzMTkkbzkkZzEkdDE3NTYyMjUzNTIkajI3JGwwJGgxMjA5MDYyMDIx"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Get Tickets
                            </a>
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                }
              />
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="w-1/2 bg-muted relative overflow-hidden">
            <ImageWithSkeleton 
              src={lfSystemImage} 
              alt="LF System" 
              className="w-full h-full object-cover brightness-90"
            />
            <div className="absolute inset-0 bg-background/5 backdrop-blur-[0.5px]" />
            <div className="absolute inset-0 bg-black/[0.03]" />
          </div>
        </div>
        <Footer />
        <ScavengerDevPanel />
      </>
    );
  }

  // Show wizard if not authenticated (no user)
  if (!user) {
    // Login panel
    if (isLoginMode) {
      return (
        <>
          <ScavengerNavigation showShoppingCart={!featureFlags?.coming_soon_mode} />
          <div className="min-h-screen flex">
            {/* Left Column - Content */}
            <div className="w-1/2 flex items-center justify-center overflow-y-auto relative z-10 shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)] border-r border-border">
              <div className="absolute inset-0 bg-topographic opacity-25 bg-no-repeat bg-cover bg-center backdrop-blur-sm" />
              <div className="w-full max-w-md px-8 py-12 relative z-10 flex items-center justify-center">
                <div className="w-full">
                  <Button
                    variant="ghost"
                    onClick={() => setIsLoginMode(false)}
                    className="mb-4 text-muted-foreground hover:text-foreground"
                  >
                    ← Back
                  </Button>
                  
                  <div className="bg-background/60 backdrop-blur-md border-2 border-border/40 p-12 w-full shadow-2xl">
                    <div className="mb-6 text-center">
                      <h1 className="font-display text-3xl md:text-4xl mb-2">Welcome Back</h1>
                      <p className="text-muted-foreground">
                        Sign in to continue the scavenger hunt
                      </p>
                    </div>
                    
                    <form onSubmit={handleLoginSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="loginEmail">Email <span className="text-fm-gold">*</span></Label>
                        <Input
                          id="loginEmail"
                          type="email"
                          placeholder="your@email.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="loginPassword">Password <span className="text-fm-gold">*</span></Label>
                        <Input
                          id="loginPassword"
                          type="password"
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? 'Signing In...' : 'Sign In'}
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="w-1/2 bg-muted relative overflow-hidden">
              <ImageWithSkeleton 
                src={lfSystemImage} 
                alt="LF System" 
                className="w-full h-full object-cover brightness-90"
              />
              <div className="absolute inset-0 bg-background/5 backdrop-blur-[0.5px]" />
              <div className="absolute inset-0 bg-black/[0.03]" />
            </div>
          </div>
          <Footer />
        </>
      );
    }

    const wizardSteps = [
      // Step 1: Welcome Message
      {
        content: (
          <MessagePanel
            isLoading={locationsLoading}
            title="You got here too early."
            description="But the free tickets are still out there. Keep searching!"
            action={
              <>
                <h2 className="font-display text-2xl md:text-3xl text-fm-gold">
                  Register for the Rave Fam
                </h2>
                <p className="text-lg text-muted-foreground">
                  You'll need to join the rave fam to snag the free tix once you find them. You can get a head start now.
                </p>
                <Button 
                  size="lg" 
                  className="w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                  onClick={nextStep}
                >
                  Join
                </Button>
                <Button 
                  size="lg" 
                  className="w-full max-w-xs mx-auto mt-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                  onClick={() => setIsLoginMode(true)}
                >
                  Sign In
                </Button>
              </>
            }
          />
        ),
        canGoBack: false,
      },
      // Step 2: Registration Form
      {
        content: (
          <div className="bg-background/60 backdrop-blur-md border-2 border-border/40 p-12 w-full shadow-2xl animate-slide-up-fade">
            <div className="mb-6 text-center">
              <h1 className="font-display text-3xl md:text-4xl mb-2">Join the Rave Fam</h1>
              <p className="text-muted-foreground">
                Register to claim your free tickets when you find them.
              </p>
            </div>
            <form onSubmit={handleJoinSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name <span className="text-fm-gold">*</span></Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-fm-gold">*</span></Label>
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
                  <Label htmlFor="displayName">Display Name <span className="text-fm-gold">*</span></Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
              </div>

              {/* Phone Number Section */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number <span className="text-fm-gold">*</span></Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This is required to receive promo tickets.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram Handle</Label>
                  <Input
                    id="instagram"
                    type="text"
                    placeholder="@yourhandle"
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                  />
                </div>
              </div>

              {/* Agreements */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="contact"
                    checked={agreeToContact}
                    onCheckedChange={(checked) => setAgreeToContact(checked as boolean)}
                    required
                  />
                  <Label htmlFor="contact" className="text-sm cursor-pointer leading-relaxed">
                    I agree to be contacted via email or by SMS to receive any award. <span className="text-fm-gold">*</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="leaderboard"
                    checked={showOnLeaderboard}
                    onCheckedChange={(checked) => setShowOnLeaderboard(checked as boolean)}
                  />
                  <Label htmlFor="leaderboard" className="text-sm cursor-pointer">
                    Show me on the leaderboard
                  </Label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? 'Joining...' : 'Join Now'}
              </Button>
            </form>
          </div>
        ),
        canGoBack: true,
      },
      // Step 3: Confirmation Message
      {
        content: (
          <MessagePanel
            title="Check Your Email"
            description="We've sent a verification link to your email address."
            action={
              <>
                <p className="text-lg text-muted-foreground">
                  Click the link in the email to complete your registration and return here to continue the scavenger hunt.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  You can safely navigate away from this page. The link will bring you back.
                </p>
              </>
            }
          />
        ),
        canGoBack: false,
      },
    ];

    return (
      <>
        <ScavengerNavigation showShoppingCart={!featureFlags?.coming_soon_mode} />
        <div className="min-h-screen flex">
          {/* Left Column - Content */}
          <div className="w-1/2 flex items-center justify-center overflow-y-auto relative z-10 shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)] border-r border-border">
            <div className="absolute inset-0 bg-topographic opacity-25 bg-no-repeat bg-cover bg-center backdrop-blur-sm" />
            <div className="w-full max-w-md px-8 py-12 relative z-10 flex items-center justify-center">
              <WizardPanel
                steps={wizardSteps}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
              />
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="w-1/2 bg-muted relative overflow-hidden">
            <ImageWithSkeleton 
              src={lfSystemImage} 
              alt="LF System" 
              className="w-full h-full object-cover brightness-90"
            />
            <div className="absolute inset-0 bg-background/5 backdrop-blur-[0.5px]" />
            <div className="absolute inset-0 bg-black/[0.03]" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // User is authenticated and has a token - show full scavenger hunt interface
  return (
    <>
      <ScavengerNavigation showShoppingCart={!featureFlags?.coming_soon_mode} />
      <div className="min-h-screen flex">
        {/* Left Column - Content */}
        <div className="w-1/2 flex items-center justify-center overflow-y-auto relative z-10 shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)] border-r border-border">
          <div className="absolute inset-0 bg-topographic opacity-25 bg-no-repeat bg-cover bg-center backdrop-blur-sm" />
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

            <div className="space-y-8">
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
            </div>
          </div>
        </div>

        {/* Right Column - Image */}
        <div className="w-1/2 bg-muted relative overflow-hidden">
          <ImageWithSkeleton 
            src={lfSystemImage} 
            alt="LF System" 
            className="w-full h-full object-cover brightness-90"
          />
          <div className="absolute inset-0 bg-background/5 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 bg-black/[0.03]" />
        </div>
      </div>
      <Footer />
      <ScavengerDevPanel />
    </>
  );
}
