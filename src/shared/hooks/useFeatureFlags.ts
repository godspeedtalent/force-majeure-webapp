import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/shared/api/supabase/client';
import {
  getFeatureFlagEnvironment,
  getEnvironmentOverride,
  isDevelopment,
} from '@/shared/utils/environment';
import { logger } from '@/shared/services/logger';
import {
  FEATURE_FLAGS,
  type FeatureFlag,
  type FeatureFlagsState,
  createEmptyFeatureFlagsState,
} from '@/shared/config/featureFlags';

const flagLogger = logger.createNamespace('FeatureFlags');

interface FeatureFlags extends FeatureFlagsState {}

interface FeatureFlagRow {
  flag_name: string;
  is_enabled: boolean;
  environment?: string;
}

export const useFeatureFlags = () => {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async (): Promise<FeatureFlags> => {
      const currentEnv = getFeatureFlagEnvironment();

      // Fetch all flags (types will be updated after migration)
      const { data, error } = await supabase
        .from('feature_flags')
        .select('flag_name, is_enabled, environment');

      if (error) throw error;

      // Filter flags by environment
      const filteredData =
        (data as unknown as FeatureFlagRow[])?.filter(
          flag => flag.environment === currentEnv || flag.environment === 'all'
        ) || [];

      // Initialize with all flags set to false
      const flags: FeatureFlags = createEmptyFeatureFlagsState();

      filteredData.forEach(flag => {
        if (flag.flag_name in flags) {
          flags[flag.flag_name as keyof FeatureFlags] = flag.is_enabled;
        }
      });

      // Apply local .env overrides in development only
      if (isDevelopment()) {
        (Object.keys(flags) as Array<keyof FeatureFlags>).forEach(flagKey => {
          const override = getEnvironmentOverride(flagKey);
          if (override !== null) {
            flags[flagKey] = override;
          }
        });
      }

      flagLogger.debug('Feature flags loaded', {
        environment: currentEnv,
        dbFlags: filteredData,
        finalFlags: flags,
      });

      return flags;
    },
    staleTime: 30 * 1000, // 30 seconds cache
    refetchOnWindowFocus: true,
  });
};

/**
 * Enhanced hook with utility methods for checking feature flags
 * Provides type-safe access to feature flags with helpful utility functions
 */
export const useFeatureFlagHelpers = () => {
  const { data: flags, isLoading } = useFeatureFlags();

  /**
   * Check if a specific feature flag is enabled
   * @param flag - Feature flag to check (use FEATURE_FLAGS constant)
   * @returns true if the flag is enabled
   */
  const isFeatureEnabled = (flag: FeatureFlag): boolean => {
    if (!flags) return false;

    // Map flag names to state keys
    const flagKey = flag as keyof FeatureFlagsState;
    return flags[flagKey] || false;
  };

  /**
   * Check if ANY of the specified feature flags are enabled
   * @param flagList - Feature flags to check
   * @returns true if at least one flag is enabled
   */
  const isAnyFeatureEnabled = (...flagList: FeatureFlag[]): boolean => {
    return flagList.some(flag => isFeatureEnabled(flag));
  };

  /**
   * Check if ALL of the specified feature flags are enabled
   * @param flagList - Feature flags to check
   * @returns true if all flags are enabled
   */
  const areAllFeaturesEnabled = (...flagList: FeatureFlag[]): boolean => {
    return flagList.every(flag => isFeatureEnabled(flag));
  };

  /**
   * Get list of all enabled feature flags
   * @returns Array of enabled feature flag names
   */
  const getEnabledFeatures = (): FeatureFlag[] => {
    if (!flags) return [];

    return (Object.keys(FEATURE_FLAGS) as Array<keyof typeof FEATURE_FLAGS>)
      .map(key => FEATURE_FLAGS[key])
      .filter(flag => isFeatureEnabled(flag));
  };

  return {
    flags,
    isLoading,
    isFeatureEnabled,
    isAnyFeatureEnabled,
    areAllFeaturesEnabled,
    getEnabledFeatures,
  };
};
