import { useEffect, useState } from 'react';
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
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/shared/utils/utils';
import { logger } from '@/shared/services/logger';
import { useEnvironmentName } from '@/shared/hooks/useEnvironment';

interface Fee {
  id: string;
  fee_name: string;
  fee_type: 'flat' | 'percentage';
  fee_value: number;
  is_active: boolean;
  environment_id: string;
}

const feeLabels: Record<string, string> = {
  sales_tax: 'Sales Tax',
  processing_fee: 'Processing Fee',
  platform_fee: 'Platform Fee',
};

export const AdminFeesSection = () => {
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
        .eq('environment_id', allEnvData.id) // Only fetch from 'all' environment
        .order('fee_name', { ascending: true });

      if (error) throw error;

      const fetchedFees = (data || []) as Fee[];
      setFees(fetchedFees);

      const initialLocal: Record<
        string,
        { type: 'flat' | 'percentage'; value: string }
      > = {};
      fetchedFees.forEach(fee => {
        initialLocal[fee.fee_name] = {
          type: fee.fee_type as 'flat' | 'percentage',
          value: fee.fee_value.toString(),
        };
      });
      setLocalFees(initialLocal);
    } catch (error) {
      logger.error('Failed to fetch fees:', error);
      toast.error('Failed to load ticketing fees');
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

        return supabase
          .from('ticketing_fees')
          .update({
            fee_type: feeData.type,
            fee_value: numValue,
          })
          .eq('fee_name', feeName)
          .eq('environment_id', fee.environment_id);
      });

      await Promise.all(updates);
      toast.success('Ticketing fees updated successfully');
      await fetchFees();
    } catch (error) {
      logger.error('Failed to update fees:', error);
      toast.error('Failed to update ticketing fees');
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
    return <div className='text-muted-foreground text-sm'>Loading...</div>;
  }

  return (
    <div className='space-y-6 max-w-2xl'>
      <div className='pb-3 border-b border-border'>
        <p className='text-xs text-muted-foreground mb-2'>
          Configure ticketing fees applied to all ticket purchases
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

      <div className='pt-4'>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!hasChanges}
          className='bg-fm-gold hover:bg-fm-gold/90 text-black disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Save Fee Settings
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className='bg-background border-border'>
          <AlertDialogHeader>
            <AlertDialogTitle className='font-canela'>
              Confirm Fee Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will update ticketing fees in the database for the{' '}
              <span className='font-semibold text-fm-gold'>{currentEnvName}</span>{' '}
              environment. These changes will affect all future ticket
              purchases. Continue?
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
