import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/shared/api/supabase/client';
import { environmentService } from '@/shared/services/environmentService';
import { logger } from '@/shared/services/logger';

const feeLogger = logger.createNamespace('TicketFees');

interface Fee {
  id: string;
  fee_name: string;
  fee_type: 'flat' | 'percentage';
  fee_value: number;
  is_active: boolean;
  environment_id: string;
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
      // Get current environment dynamically from service
      const currentEnv = await environmentService.getCurrentEnvironment();

      if (!currentEnv) {
        feeLogger.warn('Could not determine environment, using empty fees');
        return [];
      }

      // Fetch 'all' environment ID
      const { data: allEnvData, error: allEnvError } = await (supabase as any)
        .from('environments')
        .select('id')
        .eq('name', 'all')
        .single();

      if (allEnvError) {
        feeLogger.error('Failed to fetch "all" environment:', allEnvError);
      }

      const environmentIds = [currentEnv.id];
      if (allEnvData) {
        environmentIds.push(allEnvData.id);
      }

      // Fetch fees for current environment OR 'all' environment
      const { data, error } = await supabase
        .from('ticketing_fees')
        .select('*')
        .eq('is_active', true)
        .in('environment_id', environmentIds);

      if (error) {
        feeLogger.error('Failed to fetch ticketing fees:', error);
        throw error;
      }

      feeLogger.debug('Ticketing fees loaded', {
        environment: currentEnv.name,
        feeCount: data?.length || 0,
      });

      return data as unknown as Fee[];
    },
  });

  const calculateFees = (subtotal: number): FeeCalculation[] => {
    return fees.map(fee => {
      const amount =
        fee.fee_type === 'flat'
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
