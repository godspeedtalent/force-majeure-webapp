import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, Percent } from 'lucide-react';
import { FmCommonToggleHeader } from '@/components/common/forms/FmCommonToggleHeader';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { Button } from '@/components/common/shadcn/button';
import { logger } from '@/shared';
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

export const TicketingSection = () => {
  const { t } = useTranslation('common');
  const [fees, setFees] = useState<Fee[]>([]);
  const [localFees, setLocalFees] = useState<
    Record<string, { type: 'flat' | 'percentage'; value: string }>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const environment = 'dev'; // Currently always dev

  const feeLabels: Record<string, string> = {
    sales_tax: t('devTools.ticketing.salesTax'),
    processing_fee: t('devTools.ticketing.processingFee'),
    platform_fee: t('devTools.ticketing.platformFee'),
  };

  const fetchFees = async () => {
    try {
      const { data, error } = await supabase
        .from('ticketing_fees')
        .select('*')
        .eq('environment', 'all') // Only fetch from 'all' environment
        .order('fee_name', { ascending: true });

      if (error) throw error;

      setFees((data || []) as Fee[]);

      // Initialize local state
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
      toast.error(t('devTools.ticketing.loadError'));
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

        return supabase
          .from('ticketing_fees')
          .update({
            fee_type: feeData.type,
            fee_value: numValue,
          })
          .eq('fee_name', feeName)
          .eq('environment', 'all');
      });

      await Promise.all(updates);
      toast.success(t('devTools.ticketing.updateSuccess'));
      await fetchFees();
    } catch (error) {
      logger.error('Failed to update fees:', { error: error instanceof Error ? error.message : 'Unknown' });
      toast.error(t('devTools.ticketing.updateError'));
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
    return <div className='text-white/50 text-sm'>{t('status.loading')}</div>;
  }

  return (
    <div className='space-y-6'>
      <p className='text-xs text-white/50'>
        {t('devTools.ticketing.description')}
      </p>

      <FmCommonToggleHeader title={t('devTools.ticketing.taxesAndFees')}>
        <div className='space-y-4'>
          {fees.map(fee => {
            const local = localFees[fee.fee_name];
            if (!local) return null;

            return (
              <div key={fee.id} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-white text-sm font-medium'>
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
                          ? 'bg-fm-gold/20 border-fm-gold text-white'
                          : 'bg-white/5 border-white/20 text-white/70'
                      )}
                    >
                      <DollarSign className='h-3 w-3 mr-1' />
                      {t('devTools.ticketing.flat')}
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleTypeToggle(fee.fee_name)}
                      className={cn(
                        'h-8 px-3 text-xs',
                        local.type === 'percentage'
                          ? 'bg-fm-gold/20 border-fm-gold text-white'
                          : 'bg-white/5 border-white/20 text-white/70'
                      )}
                    >
                      <Percent className='h-3 w-3 mr-1' />%
                    </Button>
                  </div>
                </div>
                <FmCommonTextField
                  label={
                    local.type === 'flat' ? t('devTools.ticketing.amountDollar') : t('devTools.ticketing.amountPercent')
                  }
                  type='number'
                  value={local.value}
                  onChange={e =>
                    handleValueChange(fee.fee_name, e.target.value)
                  }
                  placeholder='0'
                  prepend={local.type === 'flat' ? '$' : '%'}
                />
              </div>
            );
          })}
        </div>
      </FmCommonToggleHeader>

      <div className='pt-4 border-t border-white/10'>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!hasChanges}
          className='w-full bg-fm-gold/20 backdrop-blur-sm border border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {t('devTools.ticketing.saveFees')}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className='bg-black/90 backdrop-blur-md border border-white/20 text-white z-[200]'>
          <AlertDialogHeader>
            <AlertDialogTitle className='font-canela text-white'>
              {t('devTools.ticketing.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className='text-white/70'>
              {t('devTools.ticketing.confirmDescription', { environment })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='bg-white/5 border-white/20 hover:bg-white/10 text-white'>
              {t('buttons.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              className='bg-fm-gold/20 backdrop-blur-sm border border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black transition-all duration-200'
            >
              {t('devTools.ticketing.saveChanges')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
