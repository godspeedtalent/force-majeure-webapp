import { Music, Map, Clock } from 'lucide-react';
import { FmCommonToggleHeader } from '@/components/ui/FmCommonToggleHeader';
import { FmCommonToggle } from '@/components/ui/FmCommonToggle';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from '@/components/ui/FmCommonToast';

export const FeatureToggleSection = () => {
  const { data: flags, refetch } = useFeatureFlags();

  const handleToggle = async (flagName: string, newValue: boolean) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: newValue })
        .eq('flag_name', flagName);

      if (error) throw error;

      toast.success(`${flagName} ${newValue ? 'enabled' : 'disabled'}`);
      await refetch();
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      toast.error('Failed to update feature flag');
    }
  };

  return (
    <FmCommonToggleHeader title="Feature Toggles">
      <div className="space-y-4">
        <FmCommonToggle
          id="music-player"
          label="Music Player"
          icon={Music}
          checked={flags?.music_player ?? false}
          onCheckedChange={(checked) => handleToggle('music_player', checked)}
        />

        <FmCommonToggle
          id="checkout-timer"
          label="Checkout Timer"
          icon={Clock}
          checked={flags?.event_checkout_timer ?? false}
          onCheckedChange={(checked) => handleToggle('event_checkout_timer', checked)}
        />

        <FmCommonToggle
          id="scavenger-hunt"
          label="Scavenger Hunt"
          icon={Map}
          checked={flags?.scavenger_hunt ?? false}
          onCheckedChange={(checked) => handleToggle('scavenger_hunt', checked)}
          disabled
        />
      </div>
    </FmCommonToggleHeader>
  );
};
