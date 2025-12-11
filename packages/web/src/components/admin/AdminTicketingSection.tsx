import { useEffect, useState } from 'react';
import { DollarSign, Percent, Timer, Info } from 'lucide-react';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';
import { supabase } from '@force-majeure/shared';
import { toast } from 'sonner';
import { cn } from '@force-majeure/shared';
import { logger } from '@force-majeure/shared';
import { useEnvironmentName, useFeatureFlagHelpers, FEATURE_FLAGS } from '@force-majeure/shared';
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

const feeLabels: Record<string, string> = {
  sales_tax: 'Sales Tax',
  processing_fee: 'Processing Fee',
  platform_fee: 'Platform Fee',
};

export const AdminTicketingSection = () => {
  // Fees state
  const [fees, setFees] = useState<Fee[]>([]);
  const [localFees, setLocalFees] = useState<
    Record<string, { type: 'flat' | 'percentage'; value: string }>
  >({});

  // Checkout timer state
  const [checkoutTimerMinutes, setCheckoutTimerMinutes] = useState<string>('10');
  const [originalCheckoutTimerMinutes, setOriginalCheckoutTimerMinutes] = useState<string>('10');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const currentEnvName = useEnvironmentName();
  const { isFeatureEnabled } = useFeatureFlagHelpers();

  const isCheckoutTimerEnabled = isFeatureEnabled(FEATURE_FLAGS.EVENT_CHECKOUT_TIMER);

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
        { type: 'flat' | 'percentage'; value: string }
      > = {};
      (data || []).forEach((fee: Fee) => {
        initialLocal[fee.fee_name] = {
          type: fee.fee_type as 'flat' | 'percentage',
          value: fee.fee_value.toString(),
        };
      });
      setLocalFees(initialLocal);
    } catch (error) {
      logger.error('Failed to fetch fees:', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      toast.error('Failed to load ticketing fees');
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

  const fetchAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchFees(), fetchCheckoutTimerSetting()]);
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

  const handleSave = async () => {
    setShowConfirmDialog(false);

    try {
      // Update fees
      const feeUpdates = Object.entries(localFees).map(([feeName, feeData]) => {
        const numValue = parseFloat(feeData.value) || 0;
        const fee = fees.find(f => f.fee_name === feeName);

        if (!fee) {
          logger.warn(`Fee not found: ${feeName}`);
          return Promise.resolve();
        }

        return supabase
          .from('ticketing_fees')
          .update({
            fee_type: feeData.type,
            fee_value: numValue,
          })
          .eq('fee_name', feeName)
          .eq('environment_id', fee.environment_id);
      });

      // Update checkout timer setting
      const timerMinutes = parseInt(checkoutTimerMinutes, 10) || 10;
      const timerUpdatePromise = updateAppSetting(
        APP_SETTING_KEYS.CHECKOUT_TIMER_DEFAULT_MINUTES,
        timerMinutes
      );

      await Promise.all([...feeUpdates, timerUpdatePromise]);
      toast.success('Ticketing settings updated successfully');
      await fetchAll();
    } catch (error) {
      logger.error('Failed to update ticketing settings:', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      toast.error('Failed to update ticketing settings');
    }
  };

  const hasFeesChanges = fees.some(fee => {
    const local = localFees[fee.fee_name];
    if (!local) return false;
    return (
      local.type !== fee.fee_type || parseFloat(local.value) !== fee.fee_value
    );
  });

  const hasTimerChanges = checkoutTimerMinutes !== originalCheckoutTimerMinutes;
  const hasChanges = hasFeesChanges || hasTimerChanges;

  if (isLoading) {
    return <div className='text-muted-foreground text-sm'>Loading...</div>;
  }

  return (
    <div className='space-y-8 max-w-2xl'>
      {/* Header */}
      <div className='pb-3 border-b border-border'>
        <p className='text-xs text-muted-foreground mb-2'>
          Configure ticketing fees and checkout behavior
        </p>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>
            Current Environment:
          </span>
          <span className='text-xs font-medium text-fm-gold uppercase'>
            {currentEnvName}
          </span>
          <span className='text-xs text-muted-foreground'>
            (Editing: <span className='text-white/70'>all environments</span>)
          </span>
        </div>
      </div>

      {/* Checkout Timer Section */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <Timer className='h-5 w-5 text-fm-gold' />
          <h3 className='text-lg font-canela font-semibold'>Checkout timer</h3>
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
                  The checkout timer creates urgency during the purchase flow.
                  When enabled, users have a limited time to complete their purchase.
                  You can override this duration per-event in the event's queue configuration.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div
          className={cn(
            'p-4 bg-muted/20 rounded-none border border-border space-y-4 transition-opacity',
            !isCheckoutTimerEnabled && 'opacity-50'
          )}
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <span className='text-foreground font-medium'>Timer enabled</span>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-none',
                  isCheckoutTimerEnabled
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                )}
              >
                {isCheckoutTimerEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
            <span className='text-xs text-muted-foreground'>
              Toggle in Feature Flags → "Event Checkout Timer"
            </span>
          </div>

          <div className={cn(!isCheckoutTimerEnabled && 'pointer-events-none')}>
            <FmCommonTextField
              label='Default duration (minutes)'
              type='number'
              value={checkoutTimerMinutes}
              onChange={e => setCheckoutTimerMinutes(e.target.value)}
              placeholder='10'
              min={1}
              max={60}
              disabled={!isCheckoutTimerEnabled}
              helperText='Time users have to complete checkout. Can be overridden per-event.'
            />
          </div>

          {!isCheckoutTimerEnabled && (
            <p className='text-xs text-muted-foreground italic'>
              Enable the "Event Checkout Timer" feature flag in Site Settings to configure this option.
            </p>
          )}
        </div>
      </div>

      {/* Fees Section */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <DollarSign className='h-5 w-5 text-fm-gold' />
          <h3 className='text-lg font-canela font-semibold'>Ticketing fees</h3>
        </div>

        <div className='grid gap-6'>
          {fees.map(fee => {
            const local = localFees[fee.fee_name];
            if (!local) return null;

            return (
              <div
                key={fee.id}
                className='space-y-3 p-4 bg-muted/20 rounded-none border border-border'
              >
                <div className='flex items-center justify-between'>
                  <span className='text-foreground font-medium'>
                    {feeLabels[fee.fee_name] || fee.fee_name}
                  </span>
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleTypeToggle(fee.fee_name)}
                      className={cn(
                        'h-8 px-3 text-xs',
                        local.type === 'flat'
                          ? 'bg-fm-gold/20 border-fm-gold text-foreground hover:bg-fm-gold/30'
                          : 'bg-background border-border text-muted-foreground hover:bg-muted'
                      )}
                    >
                      <DollarSign className='h-3 w-3 mr-1' />
                      Flat
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleTypeToggle(fee.fee_name)}
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
                  label={local.type === 'flat' ? 'Amount ($)' : 'Percentage (%)'}
                  type='number'
                  value={local.value}
                  onChange={e => handleValueChange(fee.fee_name, e.target.value)}
                  placeholder='0'
                  prepend={local.type === 'flat' ? '$' : '%'}
                />
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
          Save Ticketing Settings
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className='bg-background border-border'>
          <AlertDialogHeader>
            <AlertDialogTitle className='font-canela'>
              Confirm Ticketing Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will update ticketing settings in the database for{' '}
              <span className='font-semibold text-fm-gold'>all environments</span>.
              {hasFeesChanges && ' Fee changes will affect all future ticket purchases.'}
              {hasTimerChanges && ' Timer changes will affect all future checkouts.'}
              {' '}Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              className='bg-fm-gold hover:bg-fm-gold/90 text-black'
            >
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
