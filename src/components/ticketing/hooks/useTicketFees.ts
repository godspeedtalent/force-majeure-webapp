import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/shared/api/supabase/client';

interface Fee {
  id: string;
  fee_name: string;
  fee_type: 'flat' | 'percentage';
  fee_value: number;
  is_active: boolean;
  environment: string;
}

export interface FeeCalculation {
  name: string;
  type: 'flat' | 'percentage';
  value: number;
  amount: number;
}

export const useTicketFees = () => {
  const { data: fees = [], isLoading } = useQuery({
    queryKey: ['ticketing-fees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticketing_fees' as any)
        .select('*')
        .eq('is_active', true)
        .eq('environment', 'all');

      if (error) throw error;
      return (data || []) as unknown as Fee[];
    },
  });

  const calculateFees = (subtotal: number): FeeCalculation[] => {
    return fees.map(fee => {
      const amount = fee.fee_type === 'flat'
        ? fee.fee_value
        : (subtotal * fee.fee_value) / 100;

      return {
        name: fee.fee_name,
        type: fee.fee_type,
        value: fee.fee_value,
        amount,
      };
    });
  };

  const getTotalFees = (subtotal: number): number => {
    return calculateFees(subtotal).reduce((sum, fee) => sum + fee.amount, 0);
  };

  return {
    fees,
    isLoading,
    calculateFees,
    getTotalFees,
  };
};
