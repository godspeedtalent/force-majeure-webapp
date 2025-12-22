import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
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
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import {
  formatFlagName,
  getFlagIcon,
  getFlagDescription,
} from '@/shared';
import { useEnvironmentName } from '@/shared';
import { environmentService } from '@/shared';
import { logger } from '@/shared';
import {
  setFeatureFlagOverride,
  clearFeatureFlagOverride,
  getAllFeatureFlagOverrides,
  clearAllFeatureFlagOverrides,
} from '@/shared/utils/featureFlagOverrides';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, X, Settings2, ChevronDown } from 'lucide-react';
import { cn } from '@/shared';

interface FeatureFlagData {
  flag_name: string;
  is_enabled: boolean;
  description: string | null;
  environment_id: string;
  group_name: string | null;
}

export const FeatureToggleSection = () => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [flags, setFlags] = useState<FeatureFlagData[]>([]);
  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>({});
  const [sessionOverrides, setSessionOverrides] = useState<Record<string, boolean>>({});
  const [expandedFlags, setExpandedFlags] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const currentEnvName = useEnvironmentName();

  // Load session overrides from storage
  const loadSessionOverrides = () => {
    const overrides = getAllFeatureFlagOverrides();
    setSessionOverrides(overrides);
  };

  const fetchFlags = async () => {
    try {
      const currentEnv = await environmentService.getCurrentEnvironment();

      if (!currentEnv) {
        toast.error(t('devTools.featureToggles.envError'));
        return;
      }

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
        .select('flag_name, is_enabled, description, environment_id, group_name')
        .in('environment_id', environmentIds)
        .order('group_name', { ascending: true, nullsFirst: false })
        .order('flag_name', { ascending: true });

      if (error) throw error;

      const fetchedFlags = (data || []) as FeatureFlagData[];
      setFlags(fetchedFlags);

      const initialLocal: Record<string, boolean> = {};
      fetchedFlags.forEach((flag: FeatureFlagData) => {
        initialLocal[flag.flag_name] = flag.is_enabled;
      });
      setLocalFlags(initialLocal);
      loadSessionOverrides();
    } catch (error) {
      logger.error('Failed to fetch feature flags:', { error: error instanceof Error ? error.message : 'Unknown' });
      toast.error(t('devTools.featureToggles.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  // Group flags by group_name from database
  const { groupedFlags, groupOrder } = useMemo(() => {
    const grouped: Record<string, FeatureFlagData[]> = {};

    flags.forEach(flag => {
      const groupName = flag.group_name || 'general';
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(flag);
    });

    // Sort flags within each group by display name
    Object.keys(grouped).forEach(groupName => {
      grouped[groupName].sort((a, b) =>
        formatFlagName(a.flag_name).localeCompare(formatFlagName(b.flag_name))
      );
    });

    // Get unique group names in order they appear, with 'general' last
    const order = Object.keys(grouped).sort((a, b) => {
      if (a === 'general') return 1;
      if (b === 'general') return -1;
      return a.localeCompare(b);
    });

    return { groupedFlags: grouped, groupOrder: order };
  }, [flags]);

  const handleSessionOverrideToggle = (flagName: string) => {
    const currentOverride = sessionOverrides[flagName];
    const databaseValue = localFlags[flagName] ?? false;

    if (currentOverride === undefined) {
      // No override exists - set to opposite of database value
      const newValue = !databaseValue;
      setFeatureFlagOverride(flagName, newValue);
      setSessionOverrides(prev => ({ ...prev, [flagName]: newValue }));
    } else {
      // Override exists - toggle it
      const newValue = !currentOverride;
      setFeatureFlagOverride(flagName, newValue);
      setSessionOverrides(prev => ({ ...prev, [flagName]: newValue }));
    }

    queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    toast.success(t('devTools.sessionOverrides.overrideApplied'), {
      description: t('devTools.sessionOverrides.overrideActiveSession'),
    });
  };

  const handleClearOverride = (flagName: string) => {
    clearFeatureFlagOverride(flagName);
    setSessionOverrides(prev => {
      const updated = { ...prev };
      delete updated[flagName];
      return updated;
    });
    queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    toast.info(t('devTools.sessionOverrides.overrideCleared'), {
      description: t('devTools.sessionOverrides.usingDatabaseValue'),
    });
  };

  const handleClearAllOverrides = () => {
    clearAllFeatureFlagOverrides();
    setSessionOverrides({});
    queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    toast.info(t('devTools.sessionOverrides.allOverridesCleared'));
  };

  const toggleFlagExpanded = (flagName: string) => {
    setExpandedFlags(prev => {
      const next = new Set(prev);
      if (next.has(flagName)) {
        next.delete(flagName);
      } else {
        next.add(flagName);
      }
      return next;
    });
  };

  const toggleGroupCollapsed = (groupName: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const handleApply = async () => {
    setShowConfirmDialog(false);

    try {
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
        toast.info(t('devTools.featureToggles.noChanges'));
        return;
      }

      await Promise.all(updates);
      toast.success(t('devTools.featureToggles.applied', { count: updates.length }));
      await fetchFlags();
    } catch (error) {
      logger.error('Failed to update feature flags:', { error: error instanceof Error ? error.message : 'Unknown' });
      toast.error(t('devTools.featureToggles.updateError'));
    }
  };

  const hasChanges = flags.some(
    flag => localFlags[flag.flag_name] !== flag.is_enabled
  );

  const hasAnyOverrides = Object.keys(sessionOverrides).length > 0;
  const overrideCount = Object.keys(sessionOverrides).length;

  // Format group name for display (capitalize first letter of each word)
  const formatGroupName = (groupName: string) => {
    return groupName
      .split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <FmCommonLoadingSpinner size='sm' />
      </div>
    );
  }

  return (
    <>
      {/* Header with environment info - sticky */}
      <div className='sticky top-0 z-10 -mx-6 px-6 py-3 mb-3 border-b border-white/10 bg-black/80 backdrop-blur-md'>
        <p className='text-[10px] text-white/50 mb-1.5'>
          {t('devTools.featureToggles.description')}
        </p>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-1.5'>
            <span className='text-[10px] text-white/50'>{t('labels.currentEnvironment')}</span>
            <span className='text-[10px] font-medium text-fm-gold uppercase'>
              {currentEnvName}
            </span>
          </div>
          {hasAnyOverrides && (
            <div className='flex items-center gap-1.5'>
              <span className='text-[10px] text-white/50'>
                {t('devTools.featureToggles.overrideCount', { count: overrideCount })}
              </span>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleClearAllOverrides}
                className='h-5 px-1.5 text-[10px] text-white/50 hover:text-white hover:bg-white/10'
              >
                <RefreshCw className='h-2.5 w-2.5 mr-1' />
                {t('buttons.clearAll')}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className='space-y-4'>
        {/* Feature Toggles grouped by group_name from database */}
        {groupOrder.map(groupName => {
          const groupFlags = groupedFlags[groupName];
          if (!groupFlags || groupFlags.length === 0) return null;

          const isGroupCollapsed = collapsedGroups.has(groupName);

          return (
            <div key={groupName} className='space-y-1.5'>
              {/* Group Header - Collapsible */}
              <button
                onClick={() => toggleGroupCollapsed(groupName)}
                className='flex items-center gap-2 py-1 w-full group hover:bg-white/5 transition-colors rounded-sm'
              >
                <ChevronDown
                  className={cn(
                    'h-3 w-3 text-white/50 transition-transform duration-200',
                    isGroupCollapsed && '-rotate-90'
                  )}
                />
                <span className='text-[10px] font-medium text-white/70 uppercase tracking-wider group-hover:text-white/90 transition-colors'>
                  {formatGroupName(groupName)}
                </span>
                <span className='text-[9px] text-white/30'>
                  ({groupFlags.length})
                </span>
                <div className='flex-1 h-[1px] bg-white/10' />
              </button>

              {/* Flags in group - collapsible */}
              {!isGroupCollapsed && groupFlags.map(flag => {
                const Icon = getFlagIcon(flag.flag_name);
                const description = flag.description || getFlagDescription(flag.flag_name);
                const hasOverride = sessionOverrides[flag.flag_name] !== undefined;
                const overrideValue = sessionOverrides[flag.flag_name];
                const databaseValue = localFlags[flag.flag_name] ?? flag.is_enabled;
                // Display value: if override exists use it, otherwise use database value
                const displayValue = hasOverride ? overrideValue : databaseValue;
                const isExpanded = expandedFlags.has(flag.flag_name);

                return (
                  <div key={flag.flag_name} className='rounded-sm bg-white/5 backdrop-blur-sm border border-white/5'>
                    <div className='flex items-center gap-1 px-1.5 py-1'>
                      {/* Override expand/collapse button */}
                      <FmPortalTooltip
                        content={hasOverride ? t('devTools.featureToggles.sessionOverrideActive') : t('devTools.featureToggles.addSessionOverride')}
                        side='top'
                      >
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => toggleFlagExpanded(flag.flag_name)}
                          className={cn(
                            'h-5 w-5 p-0 flex-shrink-0 transition-colors',
                            hasOverride
                              ? 'text-fm-gold hover:text-fm-gold hover:bg-fm-gold/10'
                              : 'text-white/30 hover:text-white hover:bg-white/10'
                          )}
                        >
                          <Settings2 className='h-2.5 w-2.5' />
                        </Button>
                      </FmPortalTooltip>

                      {/* Main toggle with description tooltip */}
                      <FmPortalTooltip
                        content={description}
                        side='top'
                        className='max-w-xs'
                      >
                        <div className='flex-1'>
                          <FmCommonToggle
                            id={flag.flag_name}
                            label={formatFlagName(flag.flag_name)}
                            icon={Icon}
                            checked={displayValue}
                            onCheckedChange={() => handleSessionOverrideToggle(flag.flag_name)}
                            size='sm'
                          />
                        </div>
                      </FmPortalTooltip>

                      {/* Clear override button */}
                      {hasOverride && (
                        <FmPortalTooltip content={t('devTools.featureToggles.clearOverride')} side='top'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleClearOverride(flag.flag_name)}
                            className='h-5 w-5 p-0 text-white/30 hover:text-white hover:bg-white/10 flex-shrink-0'
                          >
                            <X className='h-2.5 w-2.5' />
                          </Button>
                        </FmPortalTooltip>
                      )}
                    </div>

                    {/* Expanded override section */}
                    {isExpanded && (
                      <div className='mx-1.5 mb-1.5 px-2 py-1.5 border-t border-white/10 bg-black/20 space-y-1.5'>
                        <div className='flex items-center justify-between'>
                          <span className='text-[10px] text-white/50'>{t('devTools.featureToggles.databaseValue')}</span>
                          <span className={cn(
                            'text-[10px] font-medium',
                            databaseValue ? 'text-green-400' : 'text-white/30'
                          )}>
                            {databaseValue ? t('devTools.featureToggles.on') : t('devTools.featureToggles.off')}
                          </span>
                        </div>
                        <div className='flex items-center justify-between'>
                          <span className='text-[10px] text-white/50'>{t('devTools.featureToggles.sessionOverride')}</span>
                          {hasOverride ? (
                            <div className='flex items-center gap-1.5'>
                              <span className={cn(
                                'text-[10px] font-medium',
                                overrideValue ? 'text-fm-gold' : 'text-white/30'
                              )}>
                                {overrideValue ? t('devTools.featureToggles.on') : t('devTools.featureToggles.off')}
                              </span>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleClearOverride(flag.flag_name)}
                                className='h-4 px-1.5 text-[9px] text-white/50 hover:text-white hover:bg-white/10'
                              >
                                {t('buttons.clear')}
                              </Button>
                            </div>
                          ) : (
                            <span className='text-[10px] text-white/30'>{t('devTools.featureToggles.none')}</span>
                          )}
                        </div>
                        {!hasOverride && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleSessionOverrideToggle(flag.flag_name)}
                            className='w-full h-5 text-[10px] border-white/20 hover:bg-white/10 mt-0.5'
                          >
                            {t('devTools.featureToggles.overrideTo', { value: databaseValue ? t('devTools.featureToggles.off') : t('devTools.featureToggles.on') })}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Apply Database Changes Button */}
        <div className='pt-3 border-t border-white/10'>
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={!hasChanges}
            className='w-full h-7 text-xs bg-fm-gold hover:bg-fm-gold/90 text-black disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {t('devTools.featureToggles.applyChanges')}
          </Button>
          <p className='text-[9px] text-white/30 mt-1.5 text-center'>
            {t('devTools.featureToggles.togglesDescription')}
          </p>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className='bg-black/90 backdrop-blur-md border border-white/20 text-white z-[200]'>
          <AlertDialogHeader>
            <AlertDialogTitle className='font-canela text-white'>
              {t('devTools.featureToggles.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className='text-white/70'>
              {t('devTools.featureToggles.confirmDescription', { environment: currentEnvName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='bg-white/5 border-white/20 hover:bg-white/10 text-white'>
              {t('buttons.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApply}
              className='bg-fm-gold hover:bg-fm-gold/90 text-black'
            >
              {t('devTools.featureToggles.applyChanges')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
