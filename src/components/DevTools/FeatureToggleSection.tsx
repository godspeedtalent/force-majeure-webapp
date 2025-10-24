import { useEffect, useState } from 'react';
import { FmCommonToggleHeader } from '@/components/ui/FmCommonToggleHeader';
import { FmCommonToggle } from '@/components/ui/FmCommonToggle';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from '@/components/ui/FmCommonToast';
import { 
  Music, 
  Clock, 
  Map, 
  EyeOff, 
  ShoppingBag, 
  UserCircle,
  LucideIcon
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FeatureFlag {
  flag_name: string;
  is_enabled: boolean;
  description: string | null;
}

// Icon mapping for feature flags
const iconMap: Record<string, LucideIcon> = {
  music_player: Music,
  event_checkout_timer: Clock,
  scavenger_hunt: Map,
  coming_soon_mode: EyeOff,
  merch_store: ShoppingBag,
  member_profiles: UserCircle,
};

// Format flag name for display
const formatFlagName = (flagName: string): string => {
  return flagName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const FeatureToggleSection = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('flag_name, is_enabled, description')
        .order('flag_name', { ascending: true });

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
      toast.error('Failed to load feature flags');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (flagName: string, newValue: boolean) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: newValue })
        .eq('flag_name', flagName);

      if (error) throw error;

      toast.success(`${formatFlagName(flagName)} ${newValue ? 'enabled' : 'disabled'}`);
      await fetchFlags();
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      toast.error('Failed to update feature flag');
    }
  };

  const enabledFlags = flags.filter(f => f.is_enabled).sort((a, b) => 
    formatFlagName(a.flag_name).localeCompare(formatFlagName(b.flag_name))
  );
  
  const disabledFlags = flags.filter(f => !f.is_enabled).sort((a, b) => 
    formatFlagName(a.flag_name).localeCompare(formatFlagName(b.flag_name))
  );

  if (isLoading) {
    return (
      <FmCommonToggleHeader title="Feature Toggles">
        <div className="text-white/50 text-sm">Loading...</div>
      </FmCommonToggleHeader>
    );
  }

  return (
    <FmCommonToggleHeader title="Feature Toggles">
      <div className="space-y-6">
        {/* Enabled Toggles */}
        {enabledFlags.length > 0 && (
          <div className="space-y-4">
            {enabledFlags.map((flag) => {
              const Icon = iconMap[flag.flag_name] || Music;
              return (
                <TooltipProvider key={flag.flag_name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <FmCommonToggle
                          id={flag.flag_name}
                          label={formatFlagName(flag.flag_name)}
                          icon={Icon}
                          checked={flag.is_enabled}
                          onCheckedChange={(checked) => handleToggle(flag.flag_name, checked)}
                        />
                      </div>
                    </TooltipTrigger>
                    {flag.description && (
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-sm">{flag.description}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        )}

        {/* Disabled Toggles Section */}
        {disabledFlags.length > 0 && (
          <div className="space-y-4">
            <div className="text-white/40 text-xs font-semibold uppercase tracking-wider">
              Disabled
            </div>
            {disabledFlags.map((flag) => {
              const Icon = iconMap[flag.flag_name] || Music;
              return (
                <TooltipProvider key={flag.flag_name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <FmCommonToggle
                          id={flag.flag_name}
                          label={formatFlagName(flag.flag_name)}
                          icon={Icon}
                          checked={flag.is_enabled}
                          onCheckedChange={(checked) => handleToggle(flag.flag_name, checked)}
                        />
                      </div>
                    </TooltipTrigger>
                    {flag.description && (
                      <TooltipContent side="left" className="max-w-xs">
                        <p className="text-sm">{flag.description}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        )}
      </div>
    </FmCommonToggleHeader>
  );
};
