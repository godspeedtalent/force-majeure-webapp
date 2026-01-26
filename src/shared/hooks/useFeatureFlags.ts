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
import { diagStart, diagComplete, diagError } from '@/shared/services/initDiagnostics';

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
      const diagKey = 'query.featureFlags';
      diagStart(diagKey);

      try {
        // Fetch current environment and "all" environment in parallel
        const [currentEnv, allEnvResult] = await Promise.all([
          environmentService.getCurrentEnvironment(),
          supabase.from('environments').select('id').eq('name', 'all').single(),
        ]);

        if (!currentEnv) {
          flagLogger.warn('Could not determine environment, using defaults');
          diagComplete(diagKey, { reason: 'no_environment', defaults: true });
          return createEmptyFeatureFlagsState();
        }

        if (allEnvResult.error) {
          flagLogger.error('Failed to fetch "all" environment:', allEnvResult.error);
        }

        const environmentIds = [currentEnv.id];
        if (allEnvResult.data) {
          environmentIds.push(allEnvResult.data.id);
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
          diagError(diagKey, error);
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

        diagComplete(diagKey, { environment: currentEnv.name, flagCount: data?.length || 0 });
        return flags;
      } catch (err) {
        diagError(diagKey, err);
        throw err;
      }
    },
    // Feature flags rarely change mid-session - cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Don't refetch on window focus - flags don't change that frequently
    refetchOnWindowFocus: false,
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
