import { useEffect, useState } from 'react';
import { DollarSign, Percent } from 'lucide-react';
import { FmCommonToggleHeader } from '@/components/ui/FmCommonToggleHeader';
import { FmCommonTextField } from '@/components/ui/FmCommonTextField';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/shared/utils/utils';

interface Fee {
  id: string;
  fee_name: string;
  fee_type: 'flat' | 'percentage';
  fee_value: number;
  is_active: boolean;
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
  const [isSaving, setIsSaving] = useState(false);

  const fetchFees = async () => {
    try {
      const { data, error } = await supabase
        .from('ticketing_fees')
        .select('*')
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
    setIsSaving(true);
    try {
      const updates = Object.entries(localFees).map(([feeName, feeData]) => {
        const numValue = parseFloat(feeData.value) || 0;
        return supabase
          .from('ticketing_fees')
          .update({
            fee_type: feeData.type,
            fee_value: numValue,
          })
          .eq('fee_name', feeName);
      });

      await Promise.all(updates);
      toast.success('Ticketing fees updated successfully');
      await fetchFees();
    } catch (error) {
      console.error('Failed to update fees:', error);
      toast.error('Failed to update ticketing fees');
    } finally {
      setIsSaving(false);
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
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="w-full bg-fm-gold hover:bg-fm-gold/90 text-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Fees'}
        </Button>
      </div>
    </div>
  );
};
