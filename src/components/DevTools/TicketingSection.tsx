import { useEffect, useState } from 'react';
import { DollarSign, Percent } from 'lucide-react';
import { FmCommonToggleHeader } from '@/components/ui/FmCommonToggleHeader';
import { FmCommonTextField } from '@/components/ui/FmCommonTextField';
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
import { cn } from '@/shared/utils/utils';

interface Fee {
  id: string;
  fee_name: string;
  fee_type: 'flat' | 'percentage';
  fee_value: number;
  is_active: boolean;
  environment: string;
}

const feeLabels: Record<string, string> = {
  sales_tax: 'Sales Tax',
  processing_fee: 'Processing Fee',
  platform_fee: 'Platform Fee',
};

export const TicketingSection = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [localFees, setLocalFees] = useState<Record<string, { type: 'flat' | 'percentage'; value: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const environment = 'dev'; // Currently always dev

  const fetchFees = async () => {
    try {
      const { data, error } = await supabase
        .from('ticketing_fees')
        .select('*')
        .or(`environment.eq.${environment},environment.eq.all`)
        .order('fee_name', { ascending: true });

      if (error) throw error;
      
      const fetchedFees = (data || []) as Fee[];
      setFees(fetchedFees);
      
      // Initialize local state
      const initialLocal: Record<string, { type: 'flat' | 'percentage'; value: string }> = {};
      fetchedFees.forEach(fee => {
        initialLocal[fee.fee_name] = {
          type: fee.fee_type as 'flat' | 'percentage',
          value: fee.fee_value.toString(),
        };
      });
      setLocalFees(initialLocal);
    } catch (error) {
      console.error('Failed to fetch fees:', error);
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
        
        return supabase
          .from('ticketing_fees')
          .update({
            fee_type: feeData.type,
            fee_value: numValue,
          })
          .eq('fee_name', feeName)
          .eq('environment', fee?.environment || environment);
      });

      await Promise.all(updates);
      toast.success('Ticketing fees updated successfully');
      await fetchFees();
    } catch (error) {
      console.error('Failed to update fees:', error);
      toast.error('Failed to update ticketing fees');
    }
  };

  const hasChanges = fees.some(fee => {
    const local = localFees[fee.fee_name];
    if (!local) return false;
    return local.type !== fee.fee_type || parseFloat(local.value) !== fee.fee_value;
  });

  if (isLoading) {
    return <div className="text-white/50 text-sm">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-white/50">
        Configure site-wide fees and taxes applied to all ticket purchases
      </p>
      
      <FmCommonToggleHeader title="Taxes and Fees">
        <div className="space-y-4">
          {fees.map((fee) => {
            const local = localFees[fee.fee_name];
            if (!local) return null;

            return (
              <div key={fee.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">
                    {feeLabels[fee.fee_name] || fee.fee_name}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTypeToggle(fee.fee_name)}
                      className={cn(
                        'h-8 px-3 text-xs',
                        local.type === 'flat'
                          ? 'bg-fm-gold/20 border-fm-gold text-white'
                          : 'bg-white/5 border-white/20 text-white/70'
                      )}
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      Flat
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTypeToggle(fee.fee_name)}
                      className={cn(
                        'h-8 px-3 text-xs',
                        local.type === 'percentage'
                          ? 'bg-fm-gold/20 border-fm-gold text-white'
                          : 'bg-white/5 border-white/20 text-white/70'
                      )}
                    >
                      <Percent className="h-3 w-3 mr-1" />
                      %
                    </Button>
                  </div>
                </div>
                <FmCommonTextField
                  label={local.type === 'flat' ? 'Amount ($)' : 'Percentage (%)'}
                  type="number"
                  value={local.value}
                  onChange={(e) => handleValueChange(fee.fee_name, e.target.value)}
                  placeholder="0"
                  prepend={local.type === 'flat' ? '$' : '%'}
                />
              </div>
            );
          })}
        </div>
      </FmCommonToggleHeader>

      <div className="pt-4 border-t border-white/10">
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={!hasChanges}
          className="w-full bg-fm-gold hover:bg-fm-gold/90 text-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Fees
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-black/90 backdrop-blur-md border border-white/20 text-white z-[200]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-canela text-white">Confirm Fee Changes</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This will update ticketing fees in the database for the <span className="font-semibold text-fm-gold">{environment}</span> environment. These changes will affect all future ticket purchases. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/20 hover:bg-white/10 text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              className="bg-fm-gold hover:bg-fm-gold/90 text-black"
            >
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
