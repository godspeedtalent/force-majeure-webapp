import { useEffect, useState } from 'react';
import { FmCommonToggle } from '@/components/ui/FmCommonToggle';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Music, 
  EyeOff, 
  ShoppingBag, 
  UserCircle,
  Ticket,
  Map,
  LucideIcon
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FeatureFlag {
  flag_name: string;
  is_enabled: boolean;
  description: string | null;
  disabled: boolean;
  environment: string;
}

// Icon mapping for feature flags
const iconMap: Record<string, LucideIcon> = {
  music_player: Music,
  coming_soon_mode: EyeOff,
  merch_store: ShoppingBag,
  member_profiles: UserCircle,
  ticketing: Ticket,
  scavenger_hunt: Map,
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
  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const environment = 'dev'; // Currently always dev

  const fetchFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('flag_name, is_enabled, description, disabled, environment')
        .or(`environment.eq.${environment},environment.eq.all`)
        .order('flag_name', { ascending: true });

      if (error) throw error;
      
      const fetchedFlags = data || [];
      setFlags(fetchedFlags);
      
      // Initialize local state with current database values
      const initialLocal: Record<string, boolean> = {};
      fetchedFlags.forEach(flag => {
        initialLocal[flag.flag_name] = flag.is_enabled;
      });
      setLocalFlags(initialLocal);
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

  const handleToggle = (flagName: string, newValue: boolean) => {
    setLocalFlags(prev => ({ ...prev, [flagName]: newValue }));
  };

  const handleApply = async () => {
    setShowConfirmDialog(false);
    
    try {
      // Update all flags that have changed
      const updates = flags
        .filter(flag => !flag.disabled && localFlags[flag.flag_name] !== flag.is_enabled)
        .map(flag => 
          supabase
            .from('feature_flags')
            .update({ is_enabled: localFlags[flag.flag_name] })
            .eq('flag_name', flag.flag_name)
            .eq('environment', flag.environment)
        );

      if (updates.length === 0) {
        toast.info('No changes to apply');
        return;
      }

      await Promise.all(updates);
      toast.success(`Applied ${updates.length} feature flag change${updates.length > 1 ? 's' : ''}`);
      await fetchFlags();
    } catch (error) {
      console.error('Failed to update feature flags:', error);
      toast.error('Failed to update feature flags');
    }
  };

  const hasChanges = flags.some(flag => 
    !flag.disabled && localFlags[flag.flag_name] !== flag.is_enabled
  );

  const editableFlags = flags
    .filter(f => !f.disabled)
    .sort((a, b) => formatFlagName(a.flag_name).localeCompare(formatFlagName(b.flag_name)));
  
  const disabledFlags = flags
    .filter(f => f.disabled)
    .sort((a, b) => formatFlagName(a.flag_name).localeCompare(formatFlagName(b.flag_name)));

  if (isLoading) {
    return <div className="text-white/50 text-sm">Loading...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Editable Toggles */}
        {editableFlags.length > 0 && (
          <div className="space-y-3">
            {editableFlags.map((flag) => {
              const Icon = iconMap[flag.flag_name] || Music;
              return (
                <TooltipProvider key={flag.flag_name}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div>
                        <FmCommonToggle
                          id={flag.flag_name}
                          label={formatFlagName(flag.flag_name)}
                          icon={Icon}
                          checked={localFlags[flag.flag_name] ?? flag.is_enabled}
                          onCheckedChange={(checked) => handleToggle(flag.flag_name, checked)}
                        />
                      </div>
                    </TooltipTrigger>
                    {flag.description && (
                      <TooltipContent side="left" className="max-w-xs bg-black/95 border-white/20 z-[150]">
                        <p className="text-sm text-white">{flag.description}</p>
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
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">
              Disabled
            </div>
            {disabledFlags.map((flag) => {
              const Icon = iconMap[flag.flag_name] || Music;
              return (
                <TooltipProvider key={flag.flag_name}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div className="opacity-50 pointer-events-none">
                        <FmCommonToggle
                          id={flag.flag_name}
                          label={formatFlagName(flag.flag_name)}
                          icon={Icon}
                          checked={flag.is_enabled}
                          onCheckedChange={() => {}}
                          disabled
                        />
                      </div>
                    </TooltipTrigger>
                    {flag.description && (
                      <TooltipContent side="left" className="max-w-xs bg-black/95 border-white/20 z-[150]">
                        <p className="text-sm text-white">{flag.description}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        )}

        {/* Apply Button */}
        <div className="pt-4 border-t border-white/10">
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={!hasChanges}
            className="w-full bg-fm-gold hover:bg-fm-gold/90 text-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Changes
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-black/90 backdrop-blur-md border border-white/20 text-white z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-canela text-white">Confirm Feature Flag Changes</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This will update feature flags in the database for the <span className="font-semibold text-fm-gold">{environment}</span> environment, and not just mock them to this session. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/20 hover:bg-white/10 text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApply}
              className="bg-fm-gold hover:bg-fm-gold/90 text-black"
            >
              Apply Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
