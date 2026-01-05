import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Percent, Timer, Info } from 'lucide-react';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { Switch } from '@/components/common/shadcn/switch';

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { cn } from '@/shared';
import { logger } from '@/shared';
import { useEnvironmentName, FEATURE_FLAGS } from '@/shared';
import { useQueryClient } from '@tanstack/react-query';
import {
  APP_SETTING_KEYS,
  fetchAppSetting,
  updateAppSetting,
} from '@/services/appSettingsService';

interface Fee {
  id: string;
  fee_name: string;
  fee_type: 'flat' | 'percentage';
  fee_value: number;
  is_active: boolean;
  environment_id: string;
  created_at: string;
  updated_at: string;
}

export const AdminTicketingSection = () => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');

  const feeLabels: Record<string, string> = {
    sales_tax: t('admin.ticketing.salesTax'),
    processing_fee: t('admin.ticketing.processingFee'),
    platform_fee: t('admin.ticketing.platformFee'),
  };
  // Fees state
  const [fees, setFees] = useState<Fee[]>([]);
  const [localFees, setLocalFees] = useState<
    Record<string, { type: 'flat' | 'percentage'; value: string; isActive: boolean }>
  >({});

  // Feature flag state for checkout timer toggle
  const [timerFlagEnabled, setTimerFlagEnabled] = useState(false);
  const [originalTimerFlagEnabled, setOriginalTimerFlagEnabled] = useState(false);
  const [timerFlagEnvId, setTimerFlagEnvId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Checkout timer state
  const [checkoutTimerMinutes, setCheckoutTimerMinutes] = useState<string>('10');
  const [originalCheckoutTimerMinutes, setOriginalCheckoutTimerMinutes] = useState<string>('10');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const currentEnvName = useEnvironmentName();

  const fetchFees = async () => {
    try {
      // Get 'all' environment dynamically
      const { data: allEnvData, error: allEnvError } = await supabase
        .from('environments')
        .select('id')
        .eq('name', 'all')
        .single();

      if (allEnvError) {
        logger.error('Failed to fetch "all" environment:', allEnvError);
        throw allEnvError;
      }

      const { data, error } = await supabase
        .from('ticketing_fees')
        .select('*')
        .eq('environment_id', allEnvData.id)
        .order('fee_name', { ascending: true });

      if (error) throw error;

      setFees((data || []) as Fee[]);

      const initialLocal: Record<
        string,
        { type: 'flat' | 'percentage'; value: string; isActive: boolean }
      > = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data || []).forEach((fee: any) => {
        initialLocal[fee.fee_name] = {
          type: fee.fee_type as 'flat' | 'percentage',
          value: fee.fee_value.toString(),
          isActive: fee.is_active ?? true,
        };
      });
      setLocalFees(initialLocal);
    } catch (error) {
      logger.error('Failed to fetch fees:', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      toast.error(tToast('admin.feesLoadFailed'));
    }
  };

  const fetchCheckoutTimerSetting = async () => {
    try {
      const value = await fetchAppSetting<number>(
        APP_SETTING_KEYS.CHECKOUT_TIMER_DEFAULT_MINUTES
      );
      const strValue = value.toString();
      setCheckoutTimerMinutes(strValue);
      setOriginalCheckoutTimerMinutes(strValue);
    } catch (error) {
      logger.error('Failed to fetch checkout timer setting:', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  };

  const fetchTimerFeatureFlag = async () => {
    try {
      // Get the 'all' environment id first
      const { data: allEnvData } = await supabase
        .from('environments')
        .select('id')
        .eq('name', 'all')
        .single();

      if (!allEnvData) {
        logger.error('Failed to fetch "all" environment for feature flag');
        return;
      }

      // Fetch the event_checkout_timer feature flag
      const { data: flagData, error: flagError } = await supabase
        .from('feature_flags')
        .select('is_enabled, environment_id')
        .eq('flag_name', FEATURE_FLAGS.EVENT_CHECKOUT_TIMER)
        .eq('environment_id', allEnvData.id)
        .single();

      if (flagError) {
        logger.error('Failed to fetch timer feature flag:', flagError);
        return;
      }

      if (flagData) {
        setTimerFlagEnabled(flagData.is_enabled);
        setOriginalTimerFlagEnabled(flagData.is_enabled);
        setTimerFlagEnvId(flagData.environment_id);
      }
    } catch (error) {
      logger.error('Failed to fetch timer feature flag:', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  };

  const fetchAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchFees(), fetchCheckoutTimerSetting(), fetchTimerFeatureFlag()]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleTypeToggle = (feeName: string) => {
    setLocalFees(prev => ({
      ...prev,
      [feeName]: {
        ...prev[feeName],
        type: prev[feeName].type === 'flat' ? 'percentage' : 'flat',
      },
    }));
  };

  const handleValueChange = (feeName: string, value: string) => {
    setLocalFees(prev => ({
      ...prev,
      [feeName]: {
        ...prev[feeName],
        value,
      },
    }));
  };

  const handleFeeActiveToggle = (feeName: string) => {
    setLocalFees(prev => ({
      ...prev,
      [feeName]: {
        ...prev[feeName],
        isActive: !prev[feeName].isActive,
      },
    }));
  };

  const handleTimerFlagToggle = () => {
    setTimerFlagEnabled(prev => !prev);
  };

  const handleSave = async () => {
    setShowConfirmDialog(false);

    try {
      // Update fees (type, value, and is_active)
      for (const [feeName, feeData] of Object.entries(localFees)) {
        const numValue = parseFloat(feeData.value) || 0;
        const fee = fees.find(f => f.fee_name === feeName);

        if (!fee) {
          logger.warn(`Fee not found: ${feeName}`);
          continue;
        }

        await supabase
          .from('ticketing_fees')
          .update({
            fee_type: feeData.type,
            fee_value: numValue,
            is_active: feeData.isActive,
          })
          .eq('fee_name', feeName)
          .eq('environment_id', fee.environment_id);
      }

      // Update checkout timer setting
      const timerMinutes = parseInt(checkoutTimerMinutes, 10) || 10;
      await updateAppSetting(
        APP_SETTING_KEYS.CHECKOUT_TIMER_DEFAULT_MINUTES,
        timerMinutes
      );

      // Update timer feature flag if changed
      if (timerFlagEnabled !== originalTimerFlagEnabled && timerFlagEnvId) {
        await supabase
          .from('feature_flags')
          .update({ is_enabled: timerFlagEnabled })
          .eq('flag_name', FEATURE_FLAGS.EVENT_CHECKOUT_TIMER)
          .eq('environment_id', timerFlagEnvId);
      }

      // Invalidate feature flags query to refresh the global state
      if (timerFlagEnabled !== originalTimerFlagEnabled) {
        queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      }

      toast.success(tToast('admin.feesUpdated'));
      await fetchAll();
    } catch (error) {
      logger.error('Failed to update ticketing settings:', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      toast.error(tToast('admin.feesUpdateFailed'));
    }
  };

  const hasFeesChanges = fees.some(fee => {
    const local = localFees[fee.fee_name];
    if (!local) return false;
    return (
      local.type !== fee.fee_type ||
      parseFloat(local.value) !== fee.fee_value ||
      local.isActive !== fee.is_active
    );
  });

  const hasTimerChanges = checkoutTimerMinutes !== originalCheckoutTimerMinutes;
  const hasTimerFlagChanges = timerFlagEnabled !== originalTimerFlagEnabled;
  const hasChanges = hasFeesChanges || hasTimerChanges || hasTimerFlagChanges;

  if (isLoading) {
    return <div className='text-muted-foreground text-sm'>{t('status.loading')}</div>;
  }

  return (
    <div className='space-y-8 max-w-2xl'>
      {/* Header */}
      <div className='pb-3 border-b border-border'>
        <p className='text-xs text-muted-foreground mb-2'>
          {t('admin.ticketing.description')}
        </p>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>
            {t('admin.ticketing.currentEnvironment')}
          </span>
          <span className='text-xs font-medium text-fm-gold uppercase'>
            {currentEnvName}
          </span>
          <span className='text-xs text-muted-foreground'>
            ({t('admin.ticketing.editing')}: <span className='text-white/70'>{t('admin.ticketing.allEnvironments')}</span>)
          </span>
        </div>
      </div>

      {/* Checkout Timer Section */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <Timer className='h-5 w-5 text-fm-gold' />
          <h3 className='text-lg font-canela font-semibold'>{t('admin.ticketing.checkoutTimer')}</h3>
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Info className='h-4 w-4 text-muted-foreground cursor-help' />
              </TooltipTrigger>
              <TooltipContent
                side='right'
                className='max-w-xs bg-black/95 border-white/20'
              >
                <p className='text-sm text-white'>
                  {t('admin.ticketing.checkoutTimerTooltip')}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className='p-4 bg-muted/20 rounded-none border border-border space-y-4'>
          {/* Timer enabled toggle */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <span className='text-foreground font-medium'>{t('admin.ticketing.timerEnabled')}</span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-none',
                  timerFlagEnabled
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                )}
              >
                {timerFlagEnabled ? t('status.on') : t('status.off')}
              </span>
            </div>
            <Switch
              id='timer-enabled'
              checked={timerFlagEnabled}
              onCheckedChange={handleTimerFlagToggle}
              className='data-[state=checked]:bg-fm-gold'
            />
          </div>

          <div className={cn(!timerFlagEnabled && 'opacity-50 pointer-events-none')}>
            <FmCommonTextField
              label={t('admin.ticketing.defaultDuration')}
              type='number'
              value={checkoutTimerMinutes}
              onChange={e => setCheckoutTimerMinutes(e.target.value)}
              placeholder='10'
              min={1}
              max={60}
              disabled={!timerFlagEnabled}
            />
          </div>

          {!timerFlagEnabled && (
            <p className='text-xs text-muted-foreground italic'>
              {t('admin.ticketing.timerDisabledHint', 'Enable the timer above to configure checkout time limits.')}
            </p>
          )}
        </div>
      </div>

      {/* Fees Section */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <DollarSign className='h-5 w-5 text-fm-gold' />
          <h3 className='text-lg font-canela font-semibold'>{t('admin.ticketing.ticketingFees')}</h3>
        </div>

        <div className='grid gap-6'>
          {fees.map(fee => {
            const local = localFees[fee.fee_name];
            if (!local) return null;

            return (
              <div
                key={fee.id}
                className={cn(
                  'space-y-3 p-4 bg-muted/20 rounded-none border border-border transition-opacity',
                  !local.isActive && 'opacity-60'
                )}
              >
                {/* Fee header with enabled toggle */}
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <span className='text-foreground font-medium'>
                      {feeLabels[fee.fee_name] || fee.fee_name}
                    </span>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-none',
                        local.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      )}
                    >
                      {local.isActive ? t('status.enabled') : t('status.disabled')}
                    </span>
                  </div>
                  <Switch
                    id={`fee-${fee.fee_name}-enabled`}
                    checked={local.isActive}
                    onCheckedChange={() => handleFeeActiveToggle(fee.fee_name)}
                    className='data-[state=checked]:bg-fm-gold'
                  />
                </div>

                {/* Fee configuration (disabled when fee is inactive) */}
                <div className={cn(!local.isActive && 'pointer-events-none')}>
                  <div className='flex items-center justify-between mb-3'>
                    <span className='text-xs text-muted-foreground uppercase'>
                      {t('admin.ticketing.feeType', 'Fee Type')}
                    </span>
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleTypeToggle(fee.fee_name)}
                        disabled={!local.isActive}
                        className={cn(
                          'h-8 px-3 text-xs',
                          local.type === 'flat'
                            ? 'bg-fm-gold/20 border-fm-gold text-foreground hover:bg-fm-gold/30'
                            : 'bg-background border-border text-muted-foreground hover:bg-muted'
                        )}
                      >
                        <DollarSign className='h-3 w-3 mr-1' />
                        {t('admin.ticketing.flat')}
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleTypeToggle(fee.fee_name)}
                        disabled={!local.isActive}
                        className={cn(
                          'h-8 px-3 text-xs',
                          local.type === 'percentage'
                            ? 'bg-fm-gold/20 border-fm-gold text-foreground hover:bg-fm-gold/30'
                            : 'bg-background border-border text-muted-foreground hover:bg-muted'
                        )}
                      >
                        <Percent className='h-3 w-3 mr-1' />%
                      </Button>
                    </div>
                  </div>
                  <FmCommonTextField
                    label={local.type === 'flat' ? t('admin.ticketing.amountDollars') : t('admin.ticketing.percentage')}
                    type='number'
                    value={local.value}
                    onChange={e => handleValueChange(fee.fee_name, e.target.value)}
                    placeholder='0'
                    prepend={local.type === 'flat' ? '$' : '%'}
                    disabled={!local.isActive}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className='pt-4'>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!hasChanges}
          className='bg-fm-gold hover:bg-fm-gold/90 text-black disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {t('admin.ticketing.saveSettings')}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className='bg-background border-border'>
          <AlertDialogHeader>
            <AlertDialogTitle className='font-canela'>
              {t('admin.ticketing.confirmChangesTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.ticketing.confirmChangesDescription')}
              {hasFeesChanges && ` ${t('admin.ticketing.feeChangesWarning')}`}
              {hasTimerChanges && ` ${t('admin.ticketing.timerChangesWarning')}`}
              {hasTimerFlagChanges && ` ${t('admin.ticketing.timerFlagChangesWarning', 'The checkout timer feature will be toggled.')}`}
              {` ${t('admin.ticketing.continueQuestion')}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              className='bg-fm-gold hover:bg-fm-gold/90 text-black'
            >
              {t('buttons.saveChanges')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
