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
  music_player: boolean;
  scavenger_hunt: boolean;
  event_checkout_timer: boolean;
  merch_store: boolean;
  member_profiles: boolean;
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
      music_player: false,
      scavenger_hunt: false,
      event_checkout_timer: false,
      merch_store: false,
      member_profiles: false,
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
        if (flag.flag_name === 'music_player') {
          flags.music_player = flag.is_enabled;
        }
        if (flag.flag_name === 'scavenger_hunt') {
          flags.scavenger_hunt = flag.is_enabled;
        }
        if (flag.flag_name === 'event_checkout_timer') {
          flags.event_checkout_timer = flag.is_enabled;
        }
        if (flag.flag_name === 'merch_store') {
          flags.merch_store = flag.is_enabled;
        }
        if (flag.flag_name === 'member_profiles') {
          flags.member_profiles = flag.is_enabled;
        }
      });

      // Apply local .env overrides in development only
      if (isDevelopment()) {
        const scavengerOverride = getEnvironmentOverride('scavenger_hunt_active');
        const comingSoonOverride = getEnvironmentOverride('coming_soon_mode');
        const leaderboardOverride = getEnvironmentOverride('show_leaderboard');
        const demoPagesOverride = getEnvironmentOverride('demo_pages');
        const musicPlayerOverride = getEnvironmentOverride('music_player');
        const scavengerHuntOverride = getEnvironmentOverride('scavenger_hunt');
        const checkoutTimerOverride = getEnvironmentOverride('event_checkout_timer');
        const merchStoreOverride = getEnvironmentOverride('merch_store');
        const memberProfilesOverride = getEnvironmentOverride('member_profiles');

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
        if (musicPlayerOverride !== null) {
          flags.music_player = musicPlayerOverride;
        }
        if (scavengerHuntOverride !== null) {
          flags.scavenger_hunt = scavengerHuntOverride;
        }
        if (checkoutTimerOverride !== null) {
          flags.event_checkout_timer = checkoutTimerOverride;
        }
        if (merchStoreOverride !== null) {
          flags.merch_store = merchStoreOverride;
        }
        if (memberProfilesOverride !== null) {
          flags.member_profiles = memberProfilesOverride;
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
