import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/shared';
import {
  getEnvironmentOverride,
  isDevelopment,
} from '@/shared';
import { logger } from '@/shared';
import { environmentService } from '@/shared';
import {
  FEATURE_FLAGS,
  type FeatureFlag,
  type FeatureFlagsState,
  createEmptyFeatureFlagsState,
} from '@/shared';
import { getFeatureFlagOverride } from '@/shared';

const flagLogger = logger.createNamespace('FeatureFlags');

interface FeatureFlags extends FeatureFlagsState {}

interface FeatureFlagRow {
  flag_name: string;
  is_enabled: boolean;
  environment: {
    name: string;
  };
}

export const useFeatureFlags = () => {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async (): Promise<FeatureFlags> => {
      // Get current environment dynamically from service
      const currentEnv = await environmentService.getCurrentEnvironment();

      if (!currentEnv) {
        flagLogger.warn('Could not determine environment, using defaults');
        return createEmptyFeatureFlagsState();
      }

      // Fetch flags for current environment OR 'all' environment
      // Using subquery to get all environment IDs that match
      const { data: allEnvData, error: allEnvError } = await supabase
        .from('environments')
        .select('id')
        .eq('name', 'all')
        .single();

      if (allEnvError) {
        flagLogger.error('Failed to fetch "all" environment:', allEnvError);
      }

      const environmentIds = [currentEnv.id];
      if (allEnvData) {
        environmentIds.push(allEnvData.id);
      }

      const { data, error } = await supabase
        .from('feature_flags')
        .select(
          `
          flag_name,
          is_enabled,
          environment:environments(name)
        `
        )
        .in('environment_id', environmentIds);

      if (error) {
        flagLogger.error('Failed to fetch feature flags:', error);
        throw error;
      }

      // Initialize with all flags set to false
      const flags: FeatureFlags = createEmptyFeatureFlagsState();

      (data as unknown as FeatureFlagRow[])?.forEach(flag => {
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

      // Apply session-based overrides (takes precedence over everything)
      // This allows admins/developers to override feature flags for their session only
      (Object.keys(flags) as Array<keyof FeatureFlags>).forEach(flagKey => {
        const sessionOverride = getFeatureFlagOverride(flagKey);
        if (sessionOverride !== null) {
          flags[flagKey] = sessionOverride;
        }
      });

      flagLogger.debug('Feature flags loaded', {
        environment: currentEnv.name,
        flagCount: data?.length || 0,
        enabledFlags: Object.entries(flags)
          .filter(([_, enabled]) => enabled)
          .map(([name]) => name),
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
