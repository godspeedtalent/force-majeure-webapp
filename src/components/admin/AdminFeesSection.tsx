import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Percent } from 'lucide-react';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
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
import { supabase } from '@/shared';
import { toast } from 'sonner';
import { cn } from '@/shared';
import { logger } from '@/shared';
import { useEnvironmentName } from '@/shared';

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

// Fee label keys - will use translations
const feeLabelKeys: Record<string, string> = {
  sales_tax: 'labels.salesTax',
  processing_fee: 'labels.processingFee',
  platform_fee: 'labels.platformFee',
};

export const AdminFeesSection = () => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const [fees, setFees] = useState<Fee[]>([]);
  const [localFees, setLocalFees] = useState<
    Record<string, { type: 'flat' | 'percentage'; value: string }>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const currentEnvName = useEnvironmentName(); // Get environment name from hook

  const fetchFees = async () => {
    try {
      // Get 'all' environment dynamically
      const { data: allEnvData, error: allEnvError } = await (supabase as any)
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
        .eq('environment_id', allEnvData.id) // Only fetch from 'all' environment
        .order('fee_name', { ascending: true });

      if (error) throw error;

      setFees((data || []) as Fee[]);

      const initialLocal: Record<
        string,
        { type: 'flat' | 'percentage'; value: string }
      > = {};
      (data || []).forEach((fee: any) => {
        initialLocal[fee.fee_name] = {
          type: fee.fee_type as 'flat' | 'percentage',
          value: fee.fee_value.toString(),
        };
      });
      setLocalFees(initialLocal);
    } catch (error) {
      logger.error('Failed to fetch fees:', { error: error instanceof Error ? error.message : 'Unknown' });
      toast.error(tToast('admin.feesLoadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
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
      const updates = Object.entries(localFees).map(([feeName, feeData]) => {
        const numValue = parseFloat(feeData.value) || 0;
        const fee = fees.find(f => f.fee_name === feeName);

        if (!fee) {
          logger.warn(`Fee not found: ${feeName}`);
          return Promise.resolve();
        }

        return (supabase as any)
          .from('ticketing_fees')
          .update({
            fee_type: feeData.type,
            fee_value: numValue,
          })
          .eq('fee_name', feeName)
          .eq('environment_id', fee.environment_id);
      });

      await Promise.all(updates);
      toast.success(tToast('admin.feesUpdated'));
      await fetchFees();
    } catch (error) {
      logger.error('Failed to update fees:', { error: error instanceof Error ? error.message : 'Unknown' });
      toast.error(tToast('admin.feesUpdateFailed'));
    }
  };

  const hasChanges = fees.some(fee => {
    const local = localFees[fee.fee_name];
    if (!local) return false;
    return (
      local.type !== fee.fee_type || parseFloat(local.value) !== fee.fee_value
    );
  });

  if (isLoading) {
    return <div className='text-muted-foreground text-sm'>{t('status.loading')}</div>;
  }

  return (
    <div className='space-y-6 max-w-2xl'>
      <div className='pb-3 border-b border-border'>
        <p className='text-xs text-muted-foreground mb-2'>
          {t('pageTitles.ticketingFeesDescription')}
        </p>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground'>
            {t('labels.currentEnvironment')}:
          </span>
          <span className='text-xs font-medium text-fm-gold uppercase'>
            {currentEnvName}
          </span>
          <span className='text-xs text-muted-foreground'>
            {t('formMessages.editingAllEnvironments')}
          </span>
        </div>
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
                  {feeLabelKeys[fee.fee_name] ? t(feeLabelKeys[fee.fee_name]) : fee.fee_name}
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
                    {t('labels.flat')}
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
                label={local.type === 'flat' ? t('labels.amountDollar') : t('labels.percentage')}
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

      <div className='pt-4'>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!hasChanges}
          className='bg-fm-gold/20 backdrop-blur-sm border border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {t('formActions.saveFeeSettings')}
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className='bg-background border-border'>
          <AlertDialogHeader>
            <AlertDialogTitle className='font-canela'>
              {t('dialogs.confirmFeeChanges')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.feeChangesDescription', { env: currentEnvName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              className='bg-fm-gold/20 backdrop-blur-sm border border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black transition-all duration-200'
            >
              {t('formActions.saveChanges')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
