import { User } from '@supabase/supabase-js';
import { useState } from 'react';

import { useAuth } from '@/features/auth/services/AuthContext';
import {
  useClaimReward,
  useScavengerLocations,
  useUserClaims,
} from '@/features/scavenger/hooks/useScavenger';
import { useToast } from '@/shared/hooks/use-toast';

// Centralized state interface for the entire scavenger hunt flow
export interface ScavengerState {
  // Authentication state
  isAuthenticated: boolean;
  user: User | null;
  userDisplayName?: string;

  // Location and validation state
  locationId: string | null;
  location: {
    id: string;
    location_name: string;
    tokens_remaining: number;
    is_active: boolean;
  } | null;

  // Claim state
  hasAlreadyClaimed: boolean;
  isClaimLoading: boolean;

  // UI flow state
  currentStep: 'welcome' | 'unauthenticated-wizard';

  // Wizard state for unauthenticated flow
  wizardStep: number;
  isLoginMode: boolean;
  registrationEmail: string;
}

// Actions interface for all possible scavenger hunt actions
export interface ScavengerActions {
  // Navigation actions
  goToWelcome: () => void;
  goToWizard: () => void;
  setWizardStep: (step: number) => void;
  setLoginMode: (isLogin: boolean) => void;
  setRegistrationEmail: (email: string) => void;

  // Authentication actions
  handleSignIn: () => void;
  handleJoin: () => void;

  // Claim actions
  claimCheckpoint: () => void;

  // Location actions
  updateLocationId: (locationId: string | null) => void;
}

interface ScavengerOrchestratorProps {
  children: (
    state: ScavengerState,
    actions: ScavengerActions
  ) => React.ReactNode;
  initialLocationId?: string | null;
}

export function ScavengerOrchestrator({
  children,
  initialLocationId = null,
}: ScavengerOrchestratorProps) {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const claimMutation = useClaimReward();
  const { data: locations } = useScavengerLocations();
  const { data: userClaims } = useUserClaims();

  // Local orchestrator state
  const [currentStep, setCurrentStep] = useState<
    'welcome' | 'unauthenticated-wizard'
  >('welcome');
  const [locationId, setLocationId] = useState<string | null>(
    initialLocationId
  );
  const [isClaimLoading, setIsClaimLoading] = useState(false);

  // Wizard flow state
  const [wizardStep, setWizardStep] = useState(1);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');

  // Generate user display name
  const userDisplayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email;

  // Find location data for current locationId
  const location =
    locationId && locations
      ? locations.find(loc => loc.id === locationId)
      : null;

  // Determine if user has already claimed this location
  const hasAlreadyClaimed = Boolean(
    locationId && userClaims?.some(claim => claim.location_id === locationId)
  );

  // Build complete state object
  const state: ScavengerState = {
    isAuthenticated: Boolean(user),
    user,
    userDisplayName,
    locationId,
    location,
    hasAlreadyClaimed,
    isClaimLoading,
    currentStep,
    wizardStep,
    isLoginMode,
    registrationEmail,
  };

  // Build complete actions object
  const actions: ScavengerActions = {
    // Navigation actions
    goToWelcome: () => setCurrentStep('welcome'),
    goToWizard: () => setCurrentStep('unauthenticated-wizard'),
    setWizardStep,
    setLoginMode: setIsLoginMode,
    setRegistrationEmail,

    // Authentication actions
    handleSignIn: () => {
      setIsLoginMode(true);
      setCurrentStep('unauthenticated-wizard');
    },

    handleJoin: () => {
      setIsLoginMode(false);
      setCurrentStep('unauthenticated-wizard');
    },

    // Claim actions
    claimCheckpoint: async () => {
      if (!locationId || !user || !userDisplayName) return;

      setIsClaimLoading(true);
      try {
        await claimMutation.mutateAsync({
          locationId,
          userEmail: user.email || '',
          displayName: userDisplayName,
          showOnLeaderboard: true,
        });

        toast({
          title: 'Success!',
          description: "You've been added to the LF SYSTEM guestlist.",
        });
      } catch (error: any) {
        console.error('Claim error:', error);
        toast({
          title: 'Error',
          description:
            error.message || 'Failed to claim checkpoint. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsClaimLoading(false);
      }
    },

    // Location actions
    updateLocationId: (newLocationId: string | null) => {
      setLocationId(newLocationId);
    },
  };

  return <>{children(state, actions)}</>;
}
