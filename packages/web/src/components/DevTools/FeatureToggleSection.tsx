import { useEffect, useState } from 'react';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { Button } from '@/components/common/shadcn/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/common/shadcn/alert-dialog';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';
import {
  formatFlagName,
  getFlagIcon,
  getFlagDescription,
} from '@/shared/utils/featureFlagUtils';
import { useEnvironmentName } from '@/shared/hooks/useEnvironment';
import { environmentService } from '@/shared/services/environmentService';
import { logger } from '@/shared/services/logger';

interface FeatureFlag {
  flag_name: string;
  is_enabled: boolean;
  description: string | null;
  environment_id: string;
}

export const FeatureToggleSection = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const currentEnvName = useEnvironmentName(); // Get environment name from hook

  const fetchFlags = async () => {
    try {
      // Get current environment dynamically
      const currentEnv = await environmentService.getCurrentEnvironment();

      if (!currentEnv) {
        toast.error('Could not determine current environment');
        return;
      }

      // Fetch 'all' environment ID
      const { data: allEnvData, error: allEnvError } = await (supabase as any)
        .from('environments')
        .select('id')
        .eq('name', 'all')
        .single();

      if (allEnvError) {
        logger.error('Failed to fetch "all" environment:', allEnvError);
      }

      const environmentIds = [currentEnv.id];
      if (allEnvData) {
        environmentIds.push(allEnvData.id);
      }

      const { data, error } = await (supabase as any)
        .from('feature_flags')
        .select('flag_name, is_enabled, description, environment_id')
        .in('environment_id', environmentIds)
        .order('flag_name', { ascending: true });

      if (error) throw error;

      const fetchedFlags = (data || []) as FeatureFlag[];
      setFlags(fetchedFlags);

      // Initialize local state with current database values
      const initialLocal: Record<string, boolean> = {};
      fetchedFlags.forEach((flag: FeatureFlag) => {
        initialLocal[flag.flag_name] = flag.is_enabled;
      });
      setLocalFlags(initialLocal);
    } catch (error) {
      logger.error('Failed to fetch feature flags:', { error: error instanceof Error ? error.message : 'Unknown' });
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
        .filter(flag => localFlags[flag.flag_name] !== flag.is_enabled)
        .map(flag =>
          supabase
            .from('feature_flags')
            .update({ is_enabled: localFlags[flag.flag_name] })
            .eq('flag_name', flag.flag_name)
            .eq('environment_id', flag.environment_id)
        );

      if (updates.length === 0) {
        toast.info('No changes to apply');
        return;
      }

      await Promise.all(updates);
      toast.success(
        `Applied ${updates.length} feature flag change${updates.length > 1 ? 's' : ''}`
      );
      await fetchFlags();
    } catch (error) {
      logger.error('Failed to update feature flags:', { error: error instanceof Error ? error.message : 'Unknown' });
      toast.error('Failed to update feature flags');
    }
  };

  const hasChanges = flags.some(
    flag => localFlags[flag.flag_name] !== flag.is_enabled
  );

  const editableFlags = flags.sort((a, b) =>
    formatFlagName(a.flag_name).localeCompare(formatFlagName(b.flag_name))
  );

  if (isLoading) {
    return <div className='text-white/50 text-sm'>Loading...</div>;
  }

  return (
    <>
      <div className='mb-4 pb-3 border-b border-white/10'>
        <p className='text-xs text-white/50 mb-2'>
          Enable or disable features across the application per environment
        </p>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-white/50'>Current Environment:</span>
          <span className='text-xs font-medium text-fm-gold uppercase'>
            {currentEnvName}
          </span>
        </div>
      </div>

      <div className='space-y-6'>
        {/* Feature Toggles */}
        {editableFlags.length > 0 && (
          <div className='space-y-3'>
            {editableFlags.map(flag => {
              const Icon = getFlagIcon(flag.flag_name);
              const description =
                flag.description || getFlagDescription(flag.flag_name);
              return (
                <TooltipProvider key={flag.flag_name}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div>
                        <FmCommonToggle
                          id={flag.flag_name}
                          label={formatFlagName(flag.flag_name)}
                          icon={Icon}
                          checked={
                            localFlags[flag.flag_name] ?? flag.is_enabled
                          }
                          onCheckedChange={checked =>
                            handleToggle(flag.flag_name, checked)
                          }
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side='left'
                      className='max-w-xs bg-black/95 border-white/20 z-[150]'
                    >
                      <p className='text-sm text-white'>{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        )}

        {/* Apply Button */}
        <div className='pt-4 border-t border-white/10'>
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={!hasChanges}
            className='w-full bg-fm-gold hover:bg-fm-gold/90 text-black disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Apply Changes
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className='bg-black/90 backdrop-blur-md border border-white/20 text-white z-[200]'>
          <AlertDialogHeader>
            <AlertDialogTitle className='font-canela text-white'>
              Confirm Feature Flag Changes
            </AlertDialogTitle>
            <AlertDialogDescription className='text-white/70'>
              This will update feature flags in the database for the{' '}
              <span className='font-semibold text-fm-gold'>{currentEnvName}</span>{' '}
              environment, and not just mock them to this session. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='bg-white/5 border-white/20 hover:bg-white/10 text-white'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApply}
              className='bg-fm-gold hover:bg-fm-gold/90 text-black'
            >
              Apply Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
