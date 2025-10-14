import { useQueryClient } from '@tanstack/react-query';

import { LoadingState } from '@/components/common/LoadingState';
import { UnauthenticatedWizard } from '@/components/scavenger/auth/UnauthenticatedWizard';
import { ScavengerFullLayout } from '@/components/scavenger/layouts/ScavengerFullLayout';
import { ScavengerSplitLayout } from '@/components/scavenger/layouts/ScavengerSplitLayout';
import { AuthenticatedUserView } from '@/components/scavenger/views/AuthenticatedUserView';
import { InvalidTokenView } from '@/components/scavenger/views/InvalidTokenView';
import { useAuth } from '@/features/auth/services/AuthContext';
import {
  useAllClaims,
  useAutoScroll,
  useClaimReward,
  useLocationClaimCount,
  useScavengerLocations,
  useScavengerNavigation,
  useUserClaims,
} from '@/features/scavenger/hooks/useScavenger';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';

// Layout components
// Scavenger components

export default function Scavenger() {
  const { user, profile, loading: authLoading } = useAuth();
  const { data: featureFlags } = useFeatureFlags();
  const queryClient = useQueryClient();

  // Use custom hooks
  const {
    locationId,
    debugMode: _debugMode,
    showInvalidToken,
    navigate,
  } = useScavengerNavigation();
  const claimMutation = useClaimReward();
  const { data: locations, isLoading: locationsLoading } =
    useScavengerLocations();
  const { data: userClaims } = useUserClaims();
  const { data: allClaims } = useAllClaims();
  const { data: claimCount } = useLocationClaimCount(locationId);

  // Auto-scroll effect
  useAutoScroll();

  // Calculate undiscovered checkpoints (locations with no claims from anyone)
  const claimedLocationIds = new Set(
    allClaims?.map(claim => claim.location_id) || []
  );
  const totalUndiscoveredCheckpoints =
    locations?.filter(location => !claimedLocationIds.has(location.id))
      .length || 0;

  // Count locations with 1 or fewer total claims
  const lowClaimLocationsCount = (() => {
    if (!locations || !allClaims) return undefined as number | undefined;
    const counts = new Map<string, number>();
    allClaims.forEach(c => {
      const id = c.location_id;
      counts.set(id, (counts.get(id) || 0) + 1);
    });
    return locations.filter(loc => (counts.get(loc.id) || 0) <= 1).length;
  })();

  // Loading state - check both auth and locations loading
  if (authLoading || locationsLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <LoadingState />
      </div>
    );
  }

  // Handle invalid token state (from error parameter)
  if (showInvalidToken || !locationId) {
    return (
      <ScavengerSplitLayout showShoppingCart={!featureFlags?.coming_soon_mode}>
        <InvalidTokenView />
      </ScavengerSplitLayout>
    );
  }

  // Handle location-based scavenger states
  if (locationId) {
    // validate-location already validated this location exists and is active
    // Check if user already claimed from this location
    const alreadyClaimed = userClaims?.some(
      claim => claim.location_id === locationId
    );

    // Check if user has ANY claims at all (regardless of checkpoint)
    const hasAnyClaim = userClaims && userClaims.length > 0;

    // Get location details for display (we know it exists since validate-location validated it)
    const location = locations?.find(loc => loc.id === locationId);

    // State 1: Already Claimed - show success panel
    // Also show success if user has any claims at all, even if not from this checkpoint
    if (alreadyClaimed || (hasAnyClaim && user)) {
      return (
        <ScavengerSplitLayout
          showShoppingCart={!featureFlags?.coming_soon_mode}
        >
          <UnauthenticatedWizard
            locationName={location?.location_name}
            onLoginSuccess={() => {
              window.location.href = window.location.href;
            }}
          userFullName={profile?.full_name ?? undefined}
            isAuthenticated={true}
            hasAlreadyClaimed={true}
            claimCount={claimCount}
            lowClaimLocationsCount={lowClaimLocationsCount}
          />
        </ScavengerSplitLayout>
      );
    }

    // Valid unclaimed location - show reward and claim flow
    if (!user) {
      // Not authenticated - show wizard to join
      console.log('👤 User not authenticated, showing wizard:', {
        locationId,
        locationName: location?.location_name,
        hasLocation: !!location,
      });

      return (
        <ScavengerSplitLayout
          showShoppingCart={!featureFlags?.coming_soon_mode}
        >
          <UnauthenticatedWizard
            locationName={location?.location_name}
            onLoginSuccess={() => {
              window.location.href = window.location.href;
            }}
            claimCount={claimCount}
            lowClaimLocationsCount={lowClaimLocationsCount}
          />
        </ScavengerSplitLayout>
      );
    }

    // Authenticated - show checkpoint claim interface
    return (
      <ScavengerSplitLayout showShoppingCart={!featureFlags?.coming_soon_mode}>
        <UnauthenticatedWizard
          locationName={location?.location_name}
          onLoginSuccess={() => {
            window.location.href = window.location.href;
          }}
          onClaimCheckpoint={async () => {
            if (!profile?.display_name || !user?.email) return;

            try {
              await claimMutation.mutateAsync({
                locationId: locationId!,
                userEmail: user.email,
                displayName: profile.display_name,
                showOnLeaderboard: true,
              });

              // Invalidate relevant queries to refetch updated data
              await queryClient.invalidateQueries({
                queryKey: ['user-claims'],
              });
              await queryClient.invalidateQueries({ queryKey: ['all-claims'] });
              await queryClient.invalidateQueries({
                queryKey: ['scavenger-locations'],
              });

              // Navigate to current URL to refresh and show success state
              const currentUrl =
                window.location.pathname + window.location.search;
              navigate(currentUrl);
            } catch (error) {
              // Error is handled by the mutation
              console.error('Claim failed:', error);
            }
          }}
          userFullName={profile?.full_name ?? undefined}
          isAuthenticated={true}
          hasAlreadyClaimed={false}
          isClaimLoading={claimMutation.isPending}
          claimCount={claimCount}
          lowClaimLocationsCount={lowClaimLocationsCount}
        />
      </ScavengerSplitLayout>
    );
  }

  // Show authenticated state without locationId
  if (user && !locationId) {
    // Check if user has any claims - if so, show success panel
    const hasAnyClaim = userClaims && userClaims.length > 0;

    if (hasAnyClaim) {
      return (
        <ScavengerSplitLayout
          showShoppingCart={!featureFlags?.coming_soon_mode}
        >
          <UnauthenticatedWizard
            locationName={undefined}
            onLoginSuccess={() => {
              window.location.href = window.location.href;
            }}
            userFullName={profile?.full_name ?? undefined}
            isAuthenticated={true}
            hasAlreadyClaimed={true}
          />
        </ScavengerSplitLayout>
      );
    }

    return (
      <ScavengerSplitLayout showShoppingCart={!featureFlags?.coming_soon_mode}>
        <AuthenticatedUserView
          displayName={profile?.display_name ?? undefined}
          totalUndiscoveredCheckpoints={totalUndiscoveredCheckpoints}
          isLoading={locationsLoading}
        />
      </ScavengerSplitLayout>
    );
  }

  // Show wizard if not authenticated (no user)
  if (!user) {
    return (
      <ScavengerSplitLayout showShoppingCart={!featureFlags?.coming_soon_mode}>
        <UnauthenticatedWizard
          onLoginSuccess={() => {
            window.location.href = window.location.href;
          }}
        />
      </ScavengerSplitLayout>
    );
  }

  // User is authenticated and has a locationId - show full scavenger hunt interface
  return (
    <ScavengerFullLayout
      showShoppingCart={!featureFlags?.coming_soon_mode}
      locations={locations}
      userClaims={userClaims}
    />
  );
}
