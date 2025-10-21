import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/shared/api/supabase/client';
import {
  getFeatureFlagEnvironment,
  getEnvironmentOverride,
  isDevelopment,
} from '@/shared/utils/environment';

interface FeatureFlags {
  scavenger_hunt_active: boolean;
  coming_soon_mode: boolean;
  show_leaderboard: boolean;
  demo_pages: boolean;
}

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
      const filteredData = (data as unknown as FeatureFlagRow[])?.filter(
        flag => flag.environment === currentEnv || flag.environment === 'all'
      ) || [];

    const flags: FeatureFlags = {
      scavenger_hunt_active: false,
      coming_soon_mode: false,
      show_leaderboard: false,
      demo_pages: false,
    };

      filteredData.forEach(flag => {
        if (flag.flag_name === 'scavenger_hunt_active') {
          flags.scavenger_hunt_active = flag.is_enabled;
        }
        if (flag.flag_name === 'coming_soon_mode') {
          flags.coming_soon_mode = flag.is_enabled;
        }
        if (flag.flag_name === 'show_leaderboard') {
          flags.show_leaderboard = flag.is_enabled;
        }
        if (flag.flag_name === 'demo_pages') {
          flags.demo_pages = flag.is_enabled;
        }
      });

      // Apply local .env overrides in development only
      if (isDevelopment()) {
        const scavengerOverride = getEnvironmentOverride('scavenger_hunt_active');
        const comingSoonOverride = getEnvironmentOverride('coming_soon_mode');
        const leaderboardOverride = getEnvironmentOverride('show_leaderboard');
        const demoPagesOverride = getEnvironmentOverride('demo_pages');

        if (scavengerOverride !== null) {
          flags.scavenger_hunt_active = scavengerOverride;
        }
        if (comingSoonOverride !== null) {
          flags.coming_soon_mode = comingSoonOverride;
        }
        if (leaderboardOverride !== null) {
          flags.show_leaderboard = leaderboardOverride;
        }
        if (demoPagesOverride !== null) {
          flags.demo_pages = demoPagesOverride;
        }
      }

      console.log('🚩 Feature flags loaded:', {
        environment: currentEnv,
        dbFlags: filteredData,
        finalFlags: flags,
        isDev: isDevelopment(),
      });

      return flags;
    },
    staleTime: 30 * 1000, // 30 seconds cache
    refetchOnWindowFocus: true,
  });
};
