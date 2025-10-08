import { LoadingState } from '@/components/LoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import {
  useAllClaims,
  useAutoScroll,
  useClaimReward,
  useScavengerLocations,
  useScavengerNavigation,
  useUserClaims
} from '@/hooks/useScavenger';
import { useQueryClient } from '@tanstack/react-query';

// Layout components
// Scavenger components
import {
  AuthenticatedUserView,
  InvalidTokenView,
  ScavengerFullLayout,
  ScavengerSplitLayout,
  UnauthenticatedWizard
} from '@/components/scavenger';


export default function Scavenger() {
  const { user, profile, loading: authLoading } = useAuth();
  const { data: featureFlags } = useFeatureFlags();
  const queryClient = useQueryClient();

  // Use custom hooks
  const { locationId, debugMode, showInvalidToken, navigate } = useScavengerNavigation();
  const claimMutation = useClaimReward();
  const { data: locations, isLoading: locationsLoading } = useScavengerLocations();
  const { data: userClaims } = useUserClaims();
  const { data: allClaims } = useAllClaims();

  // Auto-scroll effect
  useAutoScroll();

  // Calculate undiscovered checkpoints (locations with no claims from anyone)
  const claimedLocationIds = new Set(allClaims?.map(claim => claim.location_id) || []);
  const totalUndiscoveredCheckpoints = locations?.filter(location =>
    !claimedLocationIds.has(location.id)
  ).length || 0;

  // Loading state - check both auth and locations loading
  if (authLoading || locationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
    // proxy-token already validated this location exists and is active
    // Just check if user already claimed from this location
    const alreadyClaimed = userClaims?.some(
      claim => claim.location_id === locationId
    );

    // Get location details for display (we know it exists since proxy-token validated it)
    const location = locations?.find(loc => loc.id === locationId);

    // State 1: Already Claimed - show success panel
    if (alreadyClaimed) {
      return (
        <ScavengerSplitLayout showShoppingCart={!featureFlags?.coming_soon_mode}>
          <UnauthenticatedWizard
            locationName={location?.location_name}
            onLoginSuccess={() => { }}
            userDisplayName={profile?.display_name}
            isAuthenticated={true}
            hasAlreadyClaimed={true}
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
        hasLocation: !!location
      });

      return (
        <ScavengerSplitLayout showShoppingCart={!featureFlags?.coming_soon_mode}>
          <UnauthenticatedWizard
            locationName={location?.location_name}
            onLoginSuccess={() => {
              console.log('✅ Login success, navigating to refresh with current params');
              // Navigate to current URL to refresh and show authenticated state
              const currentUrl = window.location.pathname + window.location.search;
              navigate(currentUrl);
            }}
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
            console.log('✅ Login success, navigating to refresh with current params');
            // Navigate to current URL to refresh and show authenticated state
            const currentUrl = window.location.pathname + window.location.search;
            navigate(currentUrl);
          }}
          onClaimCheckpoint={async () => {
            if (!profile?.display_name || !user?.email) return;

            try {
              await claimMutation.mutateAsync({
                locationId: locationId!,
                userEmail: user.email,
                displayName: profile.display_name,
                showOnLeaderboard: true
              });

              // Invalidate relevant queries to refetch updated data
              await queryClient.invalidateQueries({ queryKey: ['user-claims'] });
              await queryClient.invalidateQueries({ queryKey: ['all-claims'] });
              await queryClient.invalidateQueries({ queryKey: ['scavenger-locations'] });

              // Navigate to current URL to refresh and show success state
              const currentUrl = window.location.pathname + window.location.search;
              navigate(currentUrl);
            } catch (error) {
              // Error is handled by the mutation
              console.error('Claim failed:', error);
            }
          }}
          userDisplayName={profile?.display_name}
          isAuthenticated={true}
          hasAlreadyClaimed={false}
          isClaimLoading={claimMutation.isPending}
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
        <ScavengerSplitLayout showShoppingCart={!featureFlags?.coming_soon_mode}>
          <UnauthenticatedWizard
            locationName={undefined}
            onLoginSuccess={() => { }}
            userDisplayName={profile?.display_name}
            isAuthenticated={true}
            hasAlreadyClaimed={true}
          />
        </ScavengerSplitLayout>
      );
    }

    return (
      <ScavengerSplitLayout showShoppingCart={!featureFlags?.coming_soon_mode}>
        <AuthenticatedUserView
          displayName={profile?.display_name}
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
            console.log('✅ Login success from general page, refreshing');
            // Navigate to current URL to refresh and show authenticated state
            const currentUrl = window.location.pathname + window.location.search;
            navigate(currentUrl);
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
