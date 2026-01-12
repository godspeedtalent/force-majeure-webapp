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

/**
 * Updates ticket tier inventory after deleting tickets during rollback.
 * Decrements sold_inventory and increments available_inventory for each affected tier.
 */
async function updateTierInventoryAfterRollback(ticketIds: string[]): Promise<void> {
  if (!ticketIds.length) return;

  try {
    // First, get the ticket tier counts by querying the tickets before deletion
    // We need to count how many tickets were in each tier
    const { data: tickets, error: fetchError } = await supabase
      .from('tickets')
      .select('ticket_tier_id')
      .in('id', ticketIds);

    if (fetchError) {
      logger.error('Failed to fetch tickets for inventory update', {
        error: fetchError.message,
        ticketIds: ticketIds.slice(0, 5), // Log first 5 for debugging
        source: 'useProcessRollback.updateTierInventoryAfterRollback',
      });
      return;
    }

    if (!tickets || tickets.length === 0) {
      logger.warn('No tickets found for inventory update - tickets may already be deleted', {
        ticketIds: ticketIds.slice(0, 5),
        source: 'useProcessRollback.updateTierInventoryAfterRollback',
      });
      return;
    }

    // Group tickets by tier
    const tierCounts = new Map<string, number>();
    for (const ticket of tickets) {
      if (ticket.ticket_tier_id) {
        tierCounts.set(
          ticket.ticket_tier_id,
          (tierCounts.get(ticket.ticket_tier_id) ?? 0) + 1
        );
      }
    }

    // Update each tier's inventory
    for (const [tierId, count] of tierCounts.entries()) {
      // Get current tier inventory
      const { data: currentTier, error: tierFetchError } = await supabase
        .from('ticket_tiers')
        .select('sold_inventory, available_inventory')
        .eq('id', tierId)
        .single();

      if (tierFetchError) {
        logger.warn('Failed to fetch tier for inventory rollback', {
          error: tierFetchError.message,
          tierId,
          source: 'useProcessRollback.updateTierInventoryAfterRollback',
        });
        continue;
      }

      if (currentTier) {
        const newSold = Math.max(0, (currentTier.sold_inventory ?? 0) - count);
        const newAvailable = (currentTier.available_inventory ?? 0) + count;

        const { error: updateError } = await supabase
          .from('ticket_tiers')
          .update({
            sold_inventory: newSold,
            available_inventory: newAvailable,
          })
          .eq('id', tierId);

        if (updateError) {
          logger.warn('Failed to update tier inventory during rollback', {
            error: updateError.message,
            tierId,
            count,
            source: 'useProcessRollback.updateTierInventoryAfterRollback',
          });
        } else {
          logger.info('Updated tier inventory after rollback', {
            tierId,
            ticketsRemoved: count,
            newSold,
            newAvailable,
            source: 'useProcessRollback.updateTierInventoryAfterRollback',
          });
        }
      }
    }
  } catch (error) {
    logger.error('Error updating tier inventory during rollback', {
      error: error instanceof Error ? error.message : 'Unknown',
      ticketCount: ticketIds.length,
      source: 'useProcessRollback.updateTierInventoryAfterRollback',
    });
  }
}

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
      address_ids?: string[]; // Addresses in normalized addresses table
    };

    if (!rollbackData.order_ids?.length) {
      if (!silent) toast.error('No rollback data available for this process');
      return false;
    }

    setIsRollingBack(process.id);

    // Track deletion results for feedback
    const deletionResults = {
      tickets: { attempted: rollbackData.ticket_ids?.length || 0, success: false, error: null as string | null },
      orderItems: { attempted: rollbackData.order_item_ids?.length || 0, success: false, error: null as string | null },
      orders: { attempted: rollbackData.order_ids?.length || 0, success: false, error: null as string | null },
      guests: { attempted: rollbackData.guest_ids?.length || 0, success: false, error: null as string | null },
      addresses: { attempted: rollbackData.address_ids?.length || 0, success: false, error: null as string | null },
    };

    try {
      // Delete in reverse order of creation (respecting foreign key constraints)
      // 1. Tickets first (they reference order_items and orders)
      if (rollbackData.ticket_ids?.length) {
        // IMPORTANT: Update tier inventory BEFORE deleting tickets
        // This ensures we can count tickets by tier before they're gone
        await updateTierInventoryAfterRollback(rollbackData.ticket_ids);

        const { error: ticketError } = await supabase
          .from('tickets')
          .delete()
          .in('id', rollbackData.ticket_ids);
        if (ticketError) {
          deletionResults.tickets.error = ticketError.message;
          logger.error('Error deleting tickets during rollback', {
            error: ticketError.message,
            processId: process.id,
            ticketCount: rollbackData.ticket_ids.length,
          });
        } else {
          deletionResults.tickets.success = true;
        }
      }

      // 2. Order items (they reference orders)
      if (rollbackData.order_item_ids?.length) {
        const { error: itemError } = await supabase
          .from('order_items')
          .delete()
          .in('id', rollbackData.order_item_ids);
        if (itemError) {
          deletionResults.orderItems.error = itemError.message;
          logger.error('Error deleting order items during rollback', {
            error: itemError.message,
            processId: process.id,
            itemCount: rollbackData.order_item_ids.length,
          });
        } else {
          deletionResults.orderItems.success = true;
        }
      }

      // 3. Orders (they reference guests via guest_id)
      if (rollbackData.order_ids?.length) {
        const { error: orderError } = await supabase
          .from('orders')
          .delete()
          .in('id', rollbackData.order_ids);
        if (orderError) {
          deletionResults.orders.error = orderError.message;
          logger.error('Error deleting orders during rollback', {
            error: orderError.message,
            processId: process.id,
            orderCount: rollbackData.order_ids.length,
          });
        } else {
          deletionResults.orders.success = true;
        }
      }

      // 4. Guests LAST (after orders are deleted to avoid constraint violations)
      // IMPORTANT: Only delete guests that were CREATED during this import process
      // Pre-existing guests are NOT included in guest_ids
      if (rollbackData.guest_ids?.length) {
        logger.info('Deleting guests created during import', {
          processId: process.id,
          guestCount: rollbackData.guest_ids.length,
          guestIds: rollbackData.guest_ids,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: guestError } = await (supabase as any)
          .from('guests')
          .delete()
          .in('id', rollbackData.guest_ids);

        if (guestError) {
          deletionResults.guests.error = guestError.message;
          logger.error('Error deleting guests during rollback', {
            error: guestError.message,
            processId: process.id,
            guestCount: rollbackData.guest_ids.length,
          });
        } else {
          deletionResults.guests.success = true;
          logger.info('Successfully deleted guests during rollback', {
            processId: process.id,
            guestCount: rollbackData.guest_ids.length,
          });
        }
      }

      // 5. Delete addresses from the normalized addresses table
      // These are addresses created during the import for new or existing guests
      if (rollbackData.address_ids?.length) {
        logger.info('Deleting addresses created during import', {
          processId: process.id,
          addressCount: rollbackData.address_ids.length,
          addressIds: rollbackData.address_ids,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: addressError } = await (supabase as any)
          .from('addresses')
          .delete()
          .in('id', rollbackData.address_ids);

        if (addressError) {
          deletionResults.addresses.error = addressError.message;
          logger.error('Error deleting addresses during rollback', {
            error: addressError.message,
            processId: process.id,
            addressCount: rollbackData.address_ids.length,
          });
        } else {
          deletionResults.addresses.success = true;
          logger.info('Successfully deleted addresses during rollback', {
            processId: process.id,
            addressCount: rollbackData.address_ids.length,
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

      // Build detailed success message
      if (!silent) {
        const deletedCounts: string[] = [];
        if (deletionResults.orders.success && deletionResults.orders.attempted > 0) {
          deletedCounts.push(`${deletionResults.orders.attempted} order${deletionResults.orders.attempted !== 1 ? 's' : ''}`);
        }
        if (deletionResults.tickets.success && deletionResults.tickets.attempted > 0) {
          deletedCounts.push(`${deletionResults.tickets.attempted} ticket${deletionResults.tickets.attempted !== 1 ? 's' : ''}`);
        }
        if (deletionResults.guests.success && deletionResults.guests.attempted > 0) {
          deletedCounts.push(`${deletionResults.guests.attempted} guest${deletionResults.guests.attempted !== 1 ? 's' : ''}`);
        }
        if (deletionResults.addresses.success && deletionResults.addresses.attempted > 0) {
          deletedCounts.push(`${deletionResults.addresses.attempted} address${deletionResults.addresses.attempted !== 1 ? 'es' : ''}`);
        }

        const successMessage = deletedCounts.length > 0
          ? `Rolled back: ${deletedCounts.join(', ')}`
          : 'Import rolled back successfully';

        // Check for any errors
        const errors: string[] = [];
        if (deletionResults.guests.error) errors.push(`guests: ${deletionResults.guests.error}`);
        if (deletionResults.orders.error) errors.push(`orders: ${deletionResults.orders.error}`);
        if (deletionResults.addresses.error) errors.push(`addresses: ${deletionResults.addresses.error}`);

        if (errors.length > 0) {
          toast.warning(`${successMessage} (some errors: ${errors.join('; ')})`);
        } else {
          toast.success(successMessage);
        }
      }

      refetchHistory();
      queryClient.invalidateQueries({ queryKey: ['event-orders'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      queryClient.invalidateQueries({ queryKey: ['event-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-tiers'] });
      return true;
    } catch (error) {
      logger.error('Error during rollback', {
        error: error instanceof Error ? error.message : 'Unknown',
        processId: process.id,
        deletionResults,
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
