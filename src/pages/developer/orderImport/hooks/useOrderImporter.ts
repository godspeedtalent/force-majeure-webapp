/**
 * Order Importer Hook
 *
 * Handles the actual import of validated orders into the database.
 * Provides live progress updates for each row being imported.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { logger } from '@/shared/services/logger';
import { toast } from 'sonner';

import type {
  ParsedOrder,
  ImportResult,
  ProcessRecord,
  LineItemTemplate,
} from '../types';

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

    const createdOrderIds: string[] = [];
    const createdOrderItemIds: string[] = [];
    const createdTicketIds: string[] = [];
    const createdGuestIds: string[] = [];
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
        // Store data for potential re-run
        rerun_data: {
          parsed_orders: validOrders,
          line_items: lineItems,
          selected_event: selectedEvent,
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newProcess, error: processError } = await (supabase as any)
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
          metadata: processMetadata,
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

      for (let i = 0; i < validOrders.length; i++) {
        const order = validOrders[i];

        // Update status to importing
        results[i] = { ...results[i], status: 'importing' };
        onResultsChange([...results]);

        try {
          let guestId: string | null = null;

          // If no existing user, create or find a guest record
          if (!order.existingUserId) {
            // First, check if a guest with this email already exists
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: existingGuest } = await (supabase as any)
              .from('guests')
              .select('id')
              .eq('email', order.customerEmail.toLowerCase())
              .maybeSingle();

            if (existingGuest) {
              guestId = existingGuest.id;
            } else {
              // Create a new guest record
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: newGuest, error: guestError } = await (supabase as any)
                .from('guests')
                .insert({
                  email: order.customerEmail.toLowerCase(),
                  full_name: order.customerName || null,
                })
                .select('id')
                .single();

              if (guestError) {
                throw new Error(`Guest creation failed: ${guestError.message}`);
              }
              guestId = newGuest.id;
              createdGuestIds.push(newGuest.id);
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(orderInsert as any)
            .select()
            .single();

          if (orderError) {
            throw new Error(`Order creation failed: ${orderError.message}`);
          }

          createdOrderIds.push(newOrder.id);

          let orderTicketCount = 0;
          const lineItemErrors: string[] = [];

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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .insert(orderItemInsert as any)
              .select()
              .single();

            if (itemError) {
              lineItemErrors.push(`Line item "${lineItem.name}": ${itemError.message}`);
              continue;
            }

            createdOrderItemIds.push(orderItem.id);

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
                  qr_code_data: `IMPORT-${newOrder.id}-${lineItem.templateId}-${j}-${Date.now()}`,
                  status: order.status === 'paid' ? 'valid' : order.status,
                  has_protection: hasProtection,
                });
              }

              const { data: createdTickets, error: ticketsError } = await supabase
                .from('tickets')
                .insert(ticketsToCreate)
                .select('id');

              if (ticketsError) {
                lineItemErrors.push(`Tickets for "${lineItem.name}": ${ticketsError.message}`);
              } else if (createdTickets) {
                createdTicketIds.push(...createdTickets.map(t => t.id));
                orderTicketCount += createdTickets.length;

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
                    source: 'useOrderImporter.importOrders',
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
                      source: 'useOrderImporter.importOrders',
                    });
                  }
                }
              }
            }

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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .insert(subItemInsert as any)
                .select()
                .single();

              if (subItemError) {
                lineItemErrors.push(`Sub-item "${subItem.name}": ${subItemError.message}`);
              } else if (subOrderItem) {
                createdOrderItemIds.push(subOrderItem.id);
              }
            }
          }

          // Order created successfully (even if some line items had issues)
          if (lineItemErrors.length > 0) {
            // Partial success - order created but some items failed
            results[i] = {
              ...results[i],
              orderId: newOrder.id,
              ticketCount: orderTicketCount,
              status: 'success',
              error: `Partial: ${lineItemErrors.join('; ')}`,
            };
            importErrors.push({ rowIndex: order.rowIndex, error: lineItemErrors.join('; ') });
          } else {
            results[i] = {
              ...results[i],
              orderId: newOrder.id,
              ticketCount: orderTicketCount,
              status: 'success',
            };
          }
          successCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results[i] = {
            ...results[i],
            status: 'failed',
            error: errorMessage,
          };
          importErrors.push({ rowIndex: order.rowIndex, error: errorMessage });
          failedCount++;

          logger.error('Error importing order', {
            error: errorMessage,
            email: order.customerEmail,
            rowIndex: order.rowIndex,
            source: 'useOrderImporter.importOrders',
          });
        }

        // Update results after each order
        onResultsChange([...results]);

        // Update process progress every 5 orders or at the end
        if (processId && (i % 5 === 0 || i === validOrders.length - 1)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('processes')
            .update({
              processed_items: i + 1,
              successful_items: successCount,
              failed_items: failedCount,
            })
            .eq('id', processId);
        }
      }

      // Final process update with error list
      if (processId) {
        const rollbackData = {
          order_ids: createdOrderIds,
          order_item_ids: createdOrderItemIds,
          ticket_ids: createdTicketIds,
          guest_ids: createdGuestIds,
        };

        const processMetadataWithErrors = {
          ...processMetadata,
          errors: importErrors,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: updatedProcess } = await (supabase as any)
          .from('processes')
          .update({
            status: failedCount === validOrders.length ? 'failed' : 'completed',
            completed_at: new Date().toISOString(),
            processed_items: validOrders.length,
            successful_items: successCount,
            failed_items: failedCount,
            metadata: processMetadataWithErrors,
            rollback_data: rollbackData,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
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
