import { ReactNode } from 'react';
import { useFeatureFlagHelpers } from '@force-majeure/shared/hooks/useFeatureFlags';
import { FeatureFlag } from '@force-majeure/shared/config/featureFlags';

interface FeatureGuardProps {
  children: ReactNode;
  /** Required feature flag(s) - at least one must be enabled */
  feature?: FeatureFlag | FeatureFlag[];
  /** Require ALL features instead of ANY */
  requireAll?: boolean;
  /** What to show when feature is disabled */
  fallback?: ReactNode;
  /** Invert the logic (show when disabled) */
  invert?: boolean;
}

/**
 * Guard component that shows children only if required feature flags are enabled
 *
 * @example
 * // Show content only if merch store is enabled
 * <FeatureGuard feature={FEATURE_FLAGS.MERCH_STORE}>
 *   <MerchStore />
 * </FeatureGuard>
 *
 * @example
 * // Show content if ANY of the features are enabled
 * <FeatureGuard feature={[FEATURE_FLAGS.MUSIC_PLAYER, FEATURE_FLAGS.SPOTIFY_INTEGRATION]}>
 *   <MusicSection />
 * </FeatureGuard>
 *
 * @example
 * // Show content only if ALL features are enabled
 * <FeatureGuard
 *   feature={[FEATURE_FLAGS.SCAVENGER_HUNT, FEATURE_FLAGS.SCAVENGER_HUNT_ACTIVE]}
 *   requireAll
 * >
 *   <ActiveScavengerHunt />
 * </FeatureGuard>
 *
 * @example
 * // Show fallback when feature is disabled
 * <FeatureGuard
 *   feature={FEATURE_FLAGS.MEMBER_PROFILES}
 *   fallback={<p>Member profiles coming soon!</p>}
 * >
 *   <MemberProfilesList />
 * </FeatureGuard>
 *
 * @example
 * // Show content when feature is DISABLED (inverted logic)
 * <FeatureGuard feature={FEATURE_FLAGS.COMING_SOON_MODE} invert>
 *   <MainContent />
 * </FeatureGuard>
 */
export const FeatureGuard = ({
  children,
  feature,
  requireAll = false,
  fallback = null,
  invert = false,
}: FeatureGuardProps) => {
  const {
    isFeatureEnabled,
    isAnyFeatureEnabled,
    areAllFeaturesEnabled,
    isLoading,
  } = useFeatureFlagHelpers();

  // While loading, don't show anything (or show fallback if provided)
  if (isLoading) {
    return <>{fallback}</>;
  }

  // If no feature specified, always show (useful for optional feature guarding)
  if (!feature) {
    return <>{children}</>;
  }

  let isEnabled = false;

  // Check features
  if (Array.isArray(feature)) {
    isEnabled = requireAll
      ? areAllFeaturesEnabled(...feature)
      : isAnyFeatureEnabled(...feature);
  } else {
    isEnabled = isFeatureEnabled(feature);
  }

  // Apply inversion if needed
  const shouldShow = invert ? !isEnabled : isEnabled;

  return shouldShow ? <>{children}</> : <>{fallback}</>;
};
