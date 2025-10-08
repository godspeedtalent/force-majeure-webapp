import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/shared/api/supabase/client';

interface FeatureFlags {
  scavenger_hunt_active: boolean;
  coming_soon_mode: boolean;
  show_leaderboard: boolean;
}

export const useFeatureFlags = () => {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async (): Promise<FeatureFlags> => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('flag_name, is_enabled');

      if (error) throw error;

      const flags: FeatureFlags = {
        scavenger_hunt_active: false,
        coming_soon_mode: false,
        show_leaderboard: false,
      };

      data?.forEach(flag => {
        if (flag.flag_name === 'scavenger_hunt_active') {
          flags.scavenger_hunt_active = flag.is_enabled;
        }
        if (flag.flag_name === 'coming_soon_mode') {
          flags.coming_soon_mode = flag.is_enabled;
        }
        if (flag.flag_name === 'show_leaderboard') {
          flags.show_leaderboard = flag.is_enabled;
        }
      });

      return flags;
    },
    staleTime: 30 * 1000, // 30 seconds cache (better for dev)
    refetchOnWindowFocus: true,
  });
};
