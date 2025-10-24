import { Music, Map } from 'lucide-react';
import { FmCommonToggleHeader } from '@/components/ui/FmCommonToggleHeader';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlags';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';

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
        <div className="flex items-center justify-between">
          <Label htmlFor="music-player" className="flex items-center gap-2 text-white cursor-pointer">
            <Music className="h-4 w-4" />
            Music Player
          </Label>
          <Switch
            id="music-player"
            checked={flags?.music_player ?? false}
            onCheckedChange={(checked) => handleToggle('music_player', checked)}
          />
        </div>

        <div className="flex items-center justify-between opacity-50">
          <Label htmlFor="scavenger-hunt" className="flex items-center gap-2 text-white cursor-not-allowed">
            <Map className="h-4 w-4" />
            Scavenger Hunt
          </Label>
          <Switch
            id="scavenger-hunt"
            checked={flags?.scavenger_hunt ?? false}
            disabled
          />
        </div>
      </div>
    </FmCommonToggleHeader>
  );
};
