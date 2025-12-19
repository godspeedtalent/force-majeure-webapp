import { logger } from '@/shared';
import { useQueryClient } from '@tanstack/react-query';

import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
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
import { useFeatureFlagHelpers } from '@/shared';
import { FEATURE_FLAGS } from '@/shared';

// Layout components
// Scavenger components

export default function Scavenger() {
  const { user, profile, loading: authLoading } = useAuth();
  const { isFeatureEnabled } = useFeatureFlagHelpers();
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
        <FmCommonLoadingState />
      </div>
    );
  }

  // Handle invalid token state (from error parameter)
  if (showInvalidToken || !locationId) {
    return (
      <ScavengerSplitLayout
        showShoppingCart={!isFeatureEnabled(FEATURE_FLAGS.COMING_SOON_MODE)}
      >
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
          showShoppingCart={!isFeatureEnabled(FEATURE_FLAGS.COMING_SOON_MODE)}
        >
          <UnauthenticatedWizard
            locationName={location?.name}
            onLoginSuccess={async () => {
              await queryClient.invalidateQueries({
                queryKey: ['user-claims'],
              });
              await queryClient.invalidateQueries({ queryKey: ['all-claims'] });
              await queryClient.invalidateQueries({
                queryKey: ['scavenger-locations'],
              });
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
      return (
        <ScavengerSplitLayout
          showShoppingCart={!isFeatureEnabled(FEATURE_FLAGS.COMING_SOON_MODE)}
        >
          <UnauthenticatedWizard
            locationName={location?.name}
            onLoginSuccess={async () => {
              await queryClient.invalidateQueries({
                queryKey: ['user-claims'],
              });
              await queryClient.invalidateQueries({ queryKey: ['all-claims'] });
              await queryClient.invalidateQueries({
                queryKey: ['scavenger-locations'],
              });
            }}
            claimCount={claimCount}
            lowClaimLocationsCount={lowClaimLocationsCount}
          />
        </ScavengerSplitLayout>
      );
    }

    // Authenticated - show checkpoint claim interface
    return (
      <ScavengerSplitLayout
        showShoppingCart={!isFeatureEnabled(FEATURE_FLAGS.COMING_SOON_MODE)}
      >
        <UnauthenticatedWizard
          locationName={location?.name}
          onLoginSuccess={async () => {
            await queryClient.invalidateQueries({ queryKey: ['user-claims'] });
            await queryClient.invalidateQueries({ queryKey: ['all-claims'] });
            await queryClient.invalidateQueries({
              queryKey: ['scavenger-locations'],
            });
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
              logger.error('Claim failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                source: 'Scavenger.tsx',
                details: 'onClaimCheckpoint',
              });
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
          showShoppingCart={!isFeatureEnabled(FEATURE_FLAGS.COMING_SOON_MODE)}
        >
          <UnauthenticatedWizard
            locationName={undefined}
            onLoginSuccess={async () => {
              await queryClient.invalidateQueries({
                queryKey: ['user-claims'],
              });
              await queryClient.invalidateQueries({ queryKey: ['all-claims'] });
              await queryClient.invalidateQueries({
                queryKey: ['scavenger-locations'],
              });
            }}
            userFullName={profile?.full_name ?? undefined}
            isAuthenticated={true}
            hasAlreadyClaimed={true}
          />
        </ScavengerSplitLayout>
      );
    }

    return (
      <ScavengerSplitLayout
        showShoppingCart={!isFeatureEnabled(FEATURE_FLAGS.COMING_SOON_MODE)}
      >
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
      <ScavengerSplitLayout
        showShoppingCart={!isFeatureEnabled(FEATURE_FLAGS.COMING_SOON_MODE)}
      >
        <UnauthenticatedWizard
          onLoginSuccess={async () => {
            await queryClient.invalidateQueries({ queryKey: ['user-claims'] });
            await queryClient.invalidateQueries({ queryKey: ['all-claims'] });
            await queryClient.invalidateQueries({
              queryKey: ['scavenger-locations'],
            });
          }}
        />
      </ScavengerSplitLayout>
    );
  }

  // User is authenticated and has a locationId - show full scavenger hunt interface
  return (
    <ScavengerFullLayout
      showShoppingCart={!isFeatureEnabled(FEATURE_FLAGS.COMING_SOON_MODE)}
      locations={locations}
      userClaims={userClaims}
    />
  );
}
