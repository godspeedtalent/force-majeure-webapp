/**
 * Order Importer Hook
 *
 * Handles the actual import of validated orders into the database.
 * Provides live progress updates with concurrent batch processing.
 * Each order is processed atomically - failures don't affect other orders.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { logger } from '@/shared/services/logger';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

import type {
  ParsedOrder,
  ImportResult,
  ProcessRecord,
  LineItemTemplate,
  UserData,
} from '../types';

import { USER_FIELD_MAPPING } from '../constants';

// Configuration for concurrent processing
const BATCH_SIZE = 10; // Number of orders to process concurrently

interface UseOrderImporterOptions {
  parsedOrders: ParsedOrder[];
  selectedEventId: string;
  selectedEvent: { id: string; title: string } | null;
  lineItems: LineItemTemplate[];
  onImportComplete?: (results: ImportResult[]) => void;
  onResultsChange: (results: ImportResult[]) => void;
  onProcessChange: (process: ProcessRecord | null) => void;
  onStepChange: (step: 'complete') => void;
}

/**
 * Result from importing a single order
 * Contains all created IDs for rollback tracking
 */
interface SingleOrderImportResult {
  success: boolean;
  orderId: string | null;
  ticketCount: number;
  error?: string;
  // Rollback tracking data
  createdOrderId?: string;
  createdOrderItemIds: string[];
  createdTicketIds: string[];
  createdGuestId?: string;
  createdAddressId?: string; // Address created in normalized addresses table
  // Partial errors (line items that failed but order succeeded)
  partialErrors: string[];
}

/**
 * Translate UserData fields to profile column names using USER_FIELD_MAPPING
 * For example: { phone: '123' } -> { phone_number: '123' }
 */
function translateUserDataToProfile(userData: UserData): Record<string, string | null> {
  const profileUpdate: Record<string, string | null> = {};

  for (const [userField, value] of Object.entries(userData)) {
    if (value === undefined || value === null) continue;

    const mapping = USER_FIELD_MAPPING[userField];
    if (mapping) {
      // Use the profile column name from the mapping
      profileUpdate[mapping.profiles] = value;
    }
  }

  return profileUpdate;
}

/**
 * Import a single order atomically
 * This function handles all the database operations for one order
 * and catches any errors without affecting other orders
 */
async function importSingleOrder(
  order: ParsedOrder,
  selectedEventId: string,
): Promise<SingleOrderImportResult> {
  const result: SingleOrderImportResult = {
    success: false,
    orderId: null,
    ticketCount: 0,
    createdOrderItemIds: [],
    createdTicketIds: [],
    partialErrors: [],
  };

  try {
    let guestId: string | null = null;

    // Get user data (supports both new userData and legacy guestAddress)
    const userData = order.userData || order.guestAddress;

    // Route userData to correct table based on whether user exists
    if (order.existingUserId) {
      // User exists - update profile with userData if provided
      if (userData && Object.keys(userData).length > 0) {
        const profileUpdate = translateUserDataToProfile(userData);
        if (Object.keys(profileUpdate).length > 0) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', order.existingUserId);

          if (profileError) {
            // Log but don't fail the order - profile update is optional
            logger.warn('Failed to update profile data', {
              error: profileError.message,
              userId: order.existingUserId,
              source: 'useOrderImporter.importSingleOrder',
            });
          }
        }
      }
    } else {
      // No existing user - create or find a guest record
      const { data: existingGuest } = await supabase
        .from('guests')
        .select('id, full_name')
        .eq('email', order.customerEmail.toLowerCase())
        .maybeSingle();

      if (existingGuest) {
        guestId = existingGuest.id;

        // Determine the best name source:
        // 1. From unmapped field assignment (userData.full_name)
        // 2. From main column mapping (customerName - which is attendee_name on ticket)
        const guestFullName = userData?.full_name || order.customerName;

        // Update guest name if provided and guest doesn't have one
        if (guestFullName && !existingGuest.full_name) {
          await supabase
            .from('guests')
            .update({ full_name: guestFullName })
            .eq('id', existingGuest.id);
        }
      } else {
        // Determine the best name source for new guest
        const guestFullName = userData?.full_name || order.customerName;

        // Create a new guest record (without address - address goes in addresses table)
        const guestInsert = {
          email: order.customerEmail.toLowerCase(),
          full_name: guestFullName || null,
        };

        const { data: newGuest, error: guestError } = await supabase
          .from('guests')
          .insert(guestInsert)
          .select('id')
          .single();

        if (guestError) {
          throw new Error(`Guest creation failed: ${guestError.message}`);
        }
        guestId = newGuest.id;
        result.createdGuestId = newGuest.id;
      }

      // Create address in normalized addresses table if we have address data
      if (guestId && userData && Object.keys(userData).length > 0) {
        // Use the upsert function to create/update the guest's billing address
        const { data: addressId, error: addressError } = await supabase.rpc('upsert_guest_billing_address', {
          p_guest_id: guestId,
          p_line_1: userData.billing_address_line_1 || undefined,
          p_line_2: userData.billing_address_line_2 || undefined,
          p_city: userData.billing_city || undefined,
          p_state: userData.billing_state || undefined,
          p_zip_code: userData.billing_zip_code || undefined,
          p_country: userData.billing_country || 'US',
        });

        if (addressError) {
          // Log but don't fail the order - address is optional
          logger.warn('Failed to create guest address', {
            error: addressError.message,
            guestId,
            source: 'useOrderImporter.importSingleOrder',
          });
        } else if (addressId) {
          // Track the created address for rollback
          result.createdAddressId = addressId as string;
        }
      }
    }

    const orderInsert = {
      event_id: selectedEventId,
      user_id: order.existingUserId || null,
      guest_id: order.existingUserId ? null : guestId,
      customer_email: order.customerEmail,
      status: order.status,
      subtotal_cents: order.subtotalCents,
      fees_cents: order.feesCents,
      total_cents: order.totalCents,
      currency: 'usd',
      created_at: order.orderDate,
    };

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderInsert)
      .select()
      .single();

    if (orderError) {
      throw new Error(`Order creation failed: ${orderError.message}`);
    }

    result.createdOrderId = newOrder.id;
    result.orderId = newOrder.id;

    // Process line items
    for (const lineItem of order.lineItems) {
      const orderItemInsert = {
        order_id: newOrder.id,
        item_type: lineItem.type === 'ticket' ? 'ticket' : 'product',
        ticket_tier_id: lineItem.type === 'ticket' ? lineItem.ticketTierId : null,
        product_id: lineItem.type === 'product' ? lineItem.productId : null,
        quantity: lineItem.quantity,
        unit_price_cents: lineItem.unitPriceCents,
        unit_fee_cents: lineItem.unitFeeCents,
      };

      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .insert(orderItemInsert)
        .select()
        .single();

      if (itemError) {
        result.partialErrors.push(`Line item "${lineItem.name}": ${itemError.message}`);
        continue;
      }

      result.createdOrderItemIds.push(orderItem.id);

      if (lineItem.type === 'ticket' && lineItem.ticketTierId) {
        const ticketsToCreate = [];
        for (let j = 0; j < lineItem.quantity; j++) {
          const hasProtection = lineItem.subItems.some(si => si.type === 'product' && si.name.toLowerCase().includes('protection'));

          ticketsToCreate.push({
            order_id: newOrder.id,
            order_item_id: orderItem.id,
            ticket_tier_id: lineItem.ticketTierId,
            event_id: selectedEventId,
            attendee_name: order.customerName,
            attendee_email: order.customerEmail,
            qr_code_data: `IMPORT-${newOrder.id}-${lineItem.templateId}-${j}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            status: order.status === 'paid' ? 'valid' : order.status,
            has_protection: hasProtection,
          });
        }

        const { data: createdTickets, error: ticketsError } = await supabase
          .from('tickets')
          .insert(ticketsToCreate)
          .select('id');

        if (ticketsError) {
          result.partialErrors.push(`Tickets for "${lineItem.name}": ${ticketsError.message}`);
        } else if (createdTickets) {
          result.createdTicketIds.push(...createdTickets.map(t => t.id));
          result.ticketCount += createdTickets.length;

          // Update ticket tier inventory to reflect sold tickets
          // First get current inventory values
          const { data: currentTier, error: tierFetchError } = await supabase
            .from('ticket_tiers')
            .select('sold_inventory, available_inventory')
            .eq('id', lineItem.ticketTierId)
            .single();

          if (tierFetchError) {
            logger.warn('Failed to fetch tier inventory for update', {
              error: tierFetchError.message,
              tierId: lineItem.ticketTierId,
              source: 'useOrderImporter.importSingleOrder',
            });
          } else if (currentTier) {
            const ticketCount = createdTickets.length;
            const { error: tierUpdateError } = await supabase
              .from('ticket_tiers')
              .update({
                sold_inventory: (currentTier.sold_inventory ?? 0) + ticketCount,
                available_inventory: Math.max(0, (currentTier.available_inventory ?? 0) - ticketCount),
              })
              .eq('id', lineItem.ticketTierId);

            if (tierUpdateError) {
              logger.warn('Failed to update tier inventory', {
                error: tierUpdateError.message,
                tierId: lineItem.ticketTierId,
                ticketCount,
                source: 'useOrderImporter.importSingleOrder',
              });
            }
          }
        }
      }

      // Process sub-items
      for (const subItem of lineItem.subItems) {
        const subItemInsert = {
          order_id: newOrder.id,
          item_type: 'product',
          product_id: subItem.productId || null,
          quantity: subItem.quantity,
          unit_price_cents: subItem.unitPriceCents,
          unit_fee_cents: 0,
        };

        const { data: subOrderItem, error: subItemError } = await supabase
          .from('order_items')
          .insert(subItemInsert)
          .select()
          .single();

        if (subItemError) {
          result.partialErrors.push(`Sub-item "${subItem.name}": ${subItemError.message}`);
        } else if (subOrderItem) {
          result.createdOrderItemIds.push(subOrderItem.id);
        }
      }
    }

    // Order created successfully (even if some line items had issues)
    result.success = true;
    if (result.partialErrors.length > 0) {
      result.error = `Partial: ${result.partialErrors.join('; ')}`;
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.success = false;
    result.error = errorMessage;

    logger.error('Error importing order', {
      error: errorMessage,
      email: order.customerEmail,
      rowIndex: order.rowIndex,
      source: 'useOrderImporter.importSingleOrder',
    });

    return result;
  }
}

/**
 * Process a batch of orders concurrently using Promise.allSettled
 * Each order is processed atomically - individual failures don't affect others
 */
async function processBatch(
  orders: Array<{ order: ParsedOrder; resultIndex: number }>,
  selectedEventId: string,
): Promise<Array<{ resultIndex: number; result: SingleOrderImportResult }>> {
  const promises = orders.map(async ({ order, resultIndex }) => {
    const result = await importSingleOrder(order, selectedEventId);
    return { resultIndex, result };
  });

  // Use Promise.allSettled to ensure all orders complete regardless of individual failures
  const settledResults = await Promise.allSettled(promises);

  return settledResults.map((settled, i) => {
    if (settled.status === 'fulfilled') {
      return settled.value;
    } else {
      // This shouldn't happen since importSingleOrder catches its own errors
      // but handle it just in case
      return {
        resultIndex: orders[i].resultIndex,
        result: {
          success: false,
          orderId: null,
          ticketCount: 0,
          createdOrderItemIds: [],
          createdTicketIds: [],
          partialErrors: [],
          error: settled.reason instanceof Error ? settled.reason.message : 'Unknown error',
        } as SingleOrderImportResult,
      };
    }
  });
}

export function useOrderImporter({
  parsedOrders,
  selectedEventId,
  selectedEvent,
  lineItems,
  onImportComplete,
  onResultsChange,
  onProcessChange,
  onStepChange,
}: UseOrderImporterOptions) {
  const { t } = useTranslation('common');

  const importOrders = useCallback(async (setIsImporting: (v: boolean) => void) => {
    const validOrders = parsedOrders.filter(o => o.validationErrors.length === 0 && !o.isDuplicate);

    if (validOrders.length === 0) {
      toast.error(t('orderCsvImport.errors.noValidOrders'));
      return;
    }

    setIsImporting(true);

    // Initialize results with pending status for all valid orders
    const results: ImportResult[] = validOrders.map(order => ({
      rowIndex: order.rowIndex,
      orderId: null,
      ticketCount: 0,
      email: order.customerEmail,
      status: 'pending' as const,
    }));
    onResultsChange([...results]);

    // Aggregated rollback data
    const createdOrderIds: string[] = [];
    const createdOrderItemIds: string[] = [];
    const createdTicketIds: string[] = [];
    const createdGuestIds: string[] = [];
    const createdAddressIds: string[] = []; // Addresses in normalized addresses table
    const importErrors: Array<{ rowIndex: number; error: string }> = [];
    let processId: string | null = null;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast.error('You must be logged in to import orders');
        return;
      }

      const totalTickets = validOrders.reduce((sum, order) => {
        return sum + order.lineItems
          .filter(li => li.type === 'ticket')
          .reduce((itemSum, li) => itemSum + li.quantity, 0);
      }, 0);

      const processMetadata = {
        event_id: selectedEventId,
        event_title: selectedEvent?.title,
        line_items_count: lineItems.length,
        total_orders: validOrders.length,
        total_tickets: totalTickets,
        batch_size: BATCH_SIZE,
        // Store data for potential re-run
        rerun_data: {
          parsed_orders: validOrders,
          line_items: lineItems,
          selected_event: selectedEvent,
        },
      };

      const { data: newProcess, error: processError } = await supabase
        .from('processes')
        .insert({
          process_type: 'order_import',
          name: `Order Import - ${selectedEvent?.title || 'Unknown Event'}`,
          status: 'running',
          started_at: new Date().toISOString(),
          total_items: validOrders.length,
          processed_items: 0,
          successful_items: 0,
          failed_items: 0,
          metadata: processMetadata as unknown as Json,
          rollback_data: {},
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (processError) {
        logger.warn('Failed to create process record', {
          error: processError.message,
          source: 'useOrderImporter.importOrders',
        });
      } else {
        processId = newProcess.id;
        onProcessChange(newProcess as ProcessRecord);
      }

      let successCount = 0;
      let failedCount = 0;
      let processedCount = 0;

      // Create batches of orders to process concurrently
      const batches: Array<Array<{ order: ParsedOrder; resultIndex: number }>> = [];
      for (let i = 0; i < validOrders.length; i += BATCH_SIZE) {
        const batch = validOrders.slice(i, i + BATCH_SIZE).map((order, batchIndex) => ({
          order,
          resultIndex: i + batchIndex,
        }));
        batches.push(batch);
      }

      logger.info('Starting concurrent import', {
        totalOrders: validOrders.length,
        batchSize: BATCH_SIZE,
        totalBatches: batches.length,
        source: 'useOrderImporter.importOrders',
      });

      // Process batches sequentially, but orders within each batch concurrently
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];

        // Mark all orders in this batch as importing
        for (const { resultIndex } of batch) {
          results[resultIndex] = { ...results[resultIndex], status: 'importing' };
        }
        onResultsChange([...results]);

        // Process all orders in the batch concurrently
        const batchResults = await processBatch(batch, selectedEventId);

        // Process results and aggregate rollback data
        for (const { resultIndex, result } of batchResults) {
          const order = validOrders[resultIndex];

          if (result.success) {
            results[resultIndex] = {
              ...results[resultIndex],
              orderId: result.orderId,
              ticketCount: result.ticketCount,
              status: 'success',
              error: result.error, // May contain partial errors
            };
            successCount++;

            // Aggregate rollback data
            if (result.createdOrderId) {
              createdOrderIds.push(result.createdOrderId);
            }
            createdOrderItemIds.push(...result.createdOrderItemIds);
            createdTicketIds.push(...result.createdTicketIds);
            if (result.createdGuestId) {
              createdGuestIds.push(result.createdGuestId);
            }
            if (result.createdAddressId) {
              createdAddressIds.push(result.createdAddressId);
            }

            // Track partial errors
            if (result.partialErrors.length > 0) {
              importErrors.push({ rowIndex: order.rowIndex, error: result.partialErrors.join('; ') });
            }
          } else {
            results[resultIndex] = {
              ...results[resultIndex],
              status: 'failed',
              error: result.error,
            };
            failedCount++;
            importErrors.push({ rowIndex: order.rowIndex, error: result.error || 'Unknown error' });
          }
        }

        processedCount += batch.length;

        // Update UI after each batch
        onResultsChange([...results]);

        // Update process progress after each batch
        if (processId) {
          await supabase
            .from('processes')
            .update({
              processed_items: processedCount,
              successful_items: successCount,
              failed_items: failedCount,
            })
            .eq('id', processId);
        }

        logger.info('Batch completed', {
          batchIndex: batchIndex + 1,
          totalBatches: batches.length,
          batchSize: batch.length,
          processedCount,
          successCount,
          failedCount,
          source: 'useOrderImporter.importOrders',
        });
      }

      // Final process update with error list
      if (processId) {
        const rollbackData = {
          order_ids: createdOrderIds,
          order_item_ids: createdOrderItemIds,
          ticket_ids: createdTicketIds,
          guest_ids: createdGuestIds,
          address_ids: createdAddressIds,
        };

        const processMetadataWithErrors = {
          ...processMetadata,
          errors: importErrors,
        };

        const { data: updatedProcess } = await supabase
          .from('processes')
          .update({
            status: failedCount === validOrders.length ? 'failed' : 'completed',
            completed_at: new Date().toISOString(),
            processed_items: validOrders.length,
            successful_items: successCount,
            failed_items: failedCount,
            metadata: processMetadataWithErrors as unknown as Json,
            rollback_data: rollbackData as unknown as Json,
            error_message: importErrors.length > 0
              ? `${importErrors.length} error(s) during import`
              : null,
          })
          .eq('id', processId)
          .select()
          .single();

        if (updatedProcess) {
          onProcessChange(updatedProcess as ProcessRecord);
        }
      }

      onStepChange('complete');

      if (failedCount === 0) {
        toast.success(t('orderCsvImport.success', { count: successCount }));
      } else if (successCount > 0) {
        toast.warning(`Imported ${successCount} orders with ${failedCount} failures`);
      } else {
        toast.error('All orders failed to import');
      }

      onImportComplete?.(results);
    } catch (error) {
      logger.error('Error importing orders', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'useOrderImporter.importOrders',
      });

      if (processId) {
        await supabase
          .from('processes')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error',
            rollback_data: {
              order_ids: createdOrderIds,
              order_item_ids: createdOrderItemIds,
              ticket_ids: createdTicketIds,
              guest_ids: createdGuestIds,
              address_ids: createdAddressIds,
            },
          })
          .eq('id', processId);
      }

      toast.error(t('orderCsvImport.errors.importFailed'));
    } finally {
      setIsImporting(false);
    }
  }, [parsedOrders, selectedEventId, lineItems, selectedEvent, t, onImportComplete, onResultsChange, onProcessChange, onStepChange]);

  return { importOrders };
}
