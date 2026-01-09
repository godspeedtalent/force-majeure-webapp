/**
 * Process Rollback Hook
 *
 * Handles rolling back completed import processes.
 */

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { logger } from '@/shared/services/logger';
import { toast } from 'sonner';

import type { ProcessRecord } from '../types';

interface UseProcessRollbackOptions {
  refetchHistory: () => void;
}

export function useProcessRollback({ refetchHistory }: UseProcessRollbackOptions) {
  const queryClient = useQueryClient();
  const [isRollingBack, setIsRollingBack] = useState<string | null>(null);

  const rollbackProcess = useCallback(async (process: ProcessRecord) => {
    if (!process.rollback_data || process.status === 'rolled_back') {
      toast.error('This process cannot be rolled back');
      return;
    }

    const rollbackData = process.rollback_data as {
      order_ids?: string[];
      order_item_ids?: string[];
      ticket_ids?: string[];
    };

    if (!rollbackData.order_ids?.length) {
      toast.error('No rollback data available for this process');
      return;
    }

    setIsRollingBack(process.id);

    try {
      // Delete in reverse order
      if (rollbackData.ticket_ids?.length) {
        const { error: ticketError } = await supabase
          .from('tickets')
          .delete()
          .in('id', rollbackData.ticket_ids);
        if (ticketError) {
          logger.error('Error deleting tickets during rollback', {
            error: ticketError.message,
            processId: process.id,
          });
        }
      }

      if (rollbackData.order_item_ids?.length) {
        const { error: itemError } = await supabase
          .from('order_items')
          .delete()
          .in('id', rollbackData.order_item_ids);
        if (itemError) {
          logger.error('Error deleting order items during rollback', {
            error: itemError.message,
            processId: process.id,
          });
        }
      }

      if (rollbackData.order_ids?.length) {
        const { error: orderError } = await supabase
          .from('orders')
          .delete()
          .in('id', rollbackData.order_ids);
        if (orderError) {
          logger.error('Error deleting orders during rollback', {
            error: orderError.message,
            processId: process.id,
          });
        }
      }

      // Update process status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('processes')
        .update({
          status: 'rolled_back',
          completed_at: new Date().toISOString(),
        })
        .eq('id', process.id);

      toast.success('Import rolled back successfully');
      refetchHistory();
      queryClient.invalidateQueries({ queryKey: ['event-orders'] });
    } catch (error) {
      logger.error('Error during rollback', {
        error: error instanceof Error ? error.message : 'Unknown',
        processId: process.id,
      });
      toast.error('Failed to rollback import');
    } finally {
      setIsRollingBack(null);
    }
  }, [refetchHistory, queryClient]);

  return { rollbackProcess, isRollingBack };
}
