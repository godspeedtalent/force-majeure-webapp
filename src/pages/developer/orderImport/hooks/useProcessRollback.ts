/**
 * Process Rollback Hook
 *
 * Handles rolling back and deleting import processes.
 */

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { logger } from '@/shared/services/logger';
import { toast } from 'sonner';

import type { ProcessRecord, ParsedOrder, LineItemTemplate } from '../types';

export interface RerunData {
  parsed_orders: ParsedOrder[];
  line_items: LineItemTemplate[];
  selected_event: { id: string; title: string } | null;
}

interface UseProcessRollbackOptions {
  refetchHistory: () => void;
}

export function useProcessRollback({ refetchHistory }: UseProcessRollbackOptions) {
  const queryClient = useQueryClient();
  const [isRollingBack, setIsRollingBack] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  // Note: isRerunning uses isRollingBack state since rerun involves rollback first
  const isRerunning: string | null = null; // Placeholder for future use

  /**
   * Extract rerun data from a process record
   */
  const getRerunData = useCallback((process: ProcessRecord): RerunData | null => {
    const metadata = process.metadata as {
      event_id?: string;
      rerun_data?: RerunData;
    };

    if (!metadata?.rerun_data) {
      return null;
    }

    return metadata.rerun_data;
  }, []);

  /**
   * Check if a process can be re-run
   */
  const canRerun = useCallback((process: ProcessRecord): boolean => {
    if (process.status !== 'completed' && process.status !== 'rolled_back') {
      return false;
    }
    return getRerunData(process) !== null;
  }, [getRerunData]);

  const rollbackProcess = useCallback(async (process: ProcessRecord, silent = false): Promise<boolean> => {
    if (!process.rollback_data || process.status === 'rolled_back') {
      if (!silent) toast.error('This process cannot be rolled back');
      return false;
    }

    const rollbackData = process.rollback_data as {
      order_ids?: string[];
      order_item_ids?: string[];
      ticket_ids?: string[];
      guest_ids?: string[];
    };

    if (!rollbackData.order_ids?.length) {
      if (!silent) toast.error('No rollback data available for this process');
      return false;
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

      // Delete guests after orders (orders reference guests)
      if (rollbackData.guest_ids?.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: guestError } = await (supabase as any)
          .from('guests')
          .delete()
          .in('id', rollbackData.guest_ids);
        if (guestError) {
          logger.error('Error deleting guests during rollback', {
            error: guestError.message,
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

      if (!silent) toast.success('Import rolled back successfully');
      refetchHistory();
      queryClient.invalidateQueries({ queryKey: ['event-orders'] });
      return true;
    } catch (error) {
      logger.error('Error during rollback', {
        error: error instanceof Error ? error.message : 'Unknown',
        processId: process.id,
      });
      if (!silent) toast.error('Failed to rollback import');
      return false;
    } finally {
      setIsRollingBack(null);
    }
  }, [refetchHistory, queryClient]);

  const deleteProcess = useCallback(async (process: ProcessRecord) => {
    // Only allow deleting failed or rolled back processes
    // Or processes where all imports failed (no successful orders)
    const rollbackData = process.rollback_data as {
      order_ids?: string[];
    } | null;

    const hasSuccessfulOrders = rollbackData?.order_ids && rollbackData.order_ids.length > 0;

    if (process.status === 'completed' && hasSuccessfulOrders) {
      toast.error('Cannot delete a completed import with orders. Rollback first.');
      return;
    }

    setIsDeleting(process.id);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('processes')
        .delete()
        .eq('id', process.id);

      if (error) {
        throw error;
      }

      toast.success('Process deleted from history');
      refetchHistory();
    } catch (error) {
      logger.error('Error deleting process', {
        error: error instanceof Error ? error.message : 'Unknown',
        processId: process.id,
      });
      toast.error('Failed to delete process');
    } finally {
      setIsDeleting(null);
    }
  }, [refetchHistory]);

  return {
    rollbackProcess,
    isRollingBack,
    deleteProcess,
    isDeleting,
    isRerunning,
    getRerunData,
    canRerun,
  };
}
