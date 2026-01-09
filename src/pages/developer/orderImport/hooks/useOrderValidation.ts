/**
 * Order Validation Hook
 *
 * Handles validation of CSV data against column mappings and line items.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { logger } from '@/shared/services/logger';
import { toast } from 'sonner';

import { FIELD_DESCRIPTIONS } from '../constants';
import {
  convertToDataType,
  resolveFieldValue,
  resolveNumericValue,
  checkLineItemCondition,
  resolveLineItemPrice,
  resolveLineItemFee,
  createDefaultTicketLineItem,
} from '../utils';

import type {
  CsvRow,
  ColumnMapping,
  LineItemTemplate,
  ParsedOrder,
  ParsedLineItem,
  ParsedSubItem,
  ResolveContext,
} from '../types';

interface UseOrderValidationOptions {
  csvData: CsvRow[];
  columnMapping: ColumnMapping;
  lineItems: LineItemTemplate[];
  selectedTicketTierId: string;
  selectedTier: { id: string; name: string; price_cents: number } | undefined;
  ticketTiers: { id: string; name: string; price_cents: number }[] | undefined;
  eventDetails: { id: string; title: string; start_time: string | null } | null | undefined;
  defaultOrderDate: string;
  onValidationComplete: (orders: ParsedOrder[]) => void;
  onStepChange: (step: 'preview') => void;
}

export function useOrderValidation({
  csvData,
  columnMapping,
  lineItems,
  selectedTicketTierId,
  selectedTier,
  ticketTiers,
  eventDetails,
  defaultOrderDate,
  onValidationComplete,
  onStepChange,
}: UseOrderValidationOptions) {
  const { t } = useTranslation('common');

  const validateOrders = useCallback(async (setIsValidating: (v: boolean) => void) => {
    if (csvData.length === 0) return;

    setIsValidating(true);
    const parsed: ParsedOrder[] = [];

    // Build tier price map
    const tierPrices = new Map<string, number>();
    ticketTiers?.forEach(tier => {
      tierPrices.set(tier.id, tier.price_cents);
    });

    const tierPrice = selectedTier?.price_cents || 0;
    const eventDate = eventDetails?.start_time ?? undefined;

    try {
      // Fetch all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email');

      const emailToUserId = new Map<string, string>();
      profiles?.forEach(p => {
        if (p.email) {
          emailToUserId.set(p.email.toLowerCase(), p.id);
        }
      });

      // Check for existing external order IDs
      const externalIds = csvData
        .map(row => resolveFieldValue(columnMapping.external_order_id, row, { tierPrice, eventDate }))
        .filter(Boolean);

      const existingExternalIds = new Set<string>();
      if (externalIds.length > 0) {
        // TODO: Query orders with matching external_order_id
      }

      // Parse each row
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const errors: string[] = [];
        const context: ResolveContext = { tierPrice, tierPrices, eventDate, row };

        // Resolve field values
        const emailRaw = resolveFieldValue(columnMapping.customer_email, row, { tierPrice, eventDate });
        const nameRaw = resolveFieldValue(columnMapping.customer_name, row, { tierPrice, eventDate });
        const orderDateRaw = resolveFieldValue(columnMapping.created_at, row, { tierPrice, eventDate }) || defaultOrderDate;
        const statusRaw = resolveFieldValue(columnMapping.status, row, { tierPrice, eventDate }) || 'completed';
        const externalOrderIdRaw = resolveFieldValue(columnMapping.external_order_id, row, { tierPrice, eventDate });

        // Convert values
        const emailResult = convertToDataType(emailRaw, 'text');
        const email = ((emailResult.value as string) || '').toLowerCase();

        const nameResult = convertToDataType(nameRaw, 'text');
        const name = (nameResult.value as string) || '';

        const dateResult = convertToDataType(orderDateRaw, 'date');
        if (dateResult.error) errors.push(`Order Date: ${dateResult.error}`);
        const orderDate = (dateResult.value as string) || defaultOrderDate;

        const statusResult = convertToDataType(statusRaw, 'enum', FIELD_DESCRIPTIONS.status.enumValues);
        if (statusResult.error) errors.push(`Status: ${statusResult.error}`);
        const status = (statusResult.value as 'completed' | 'refunded' | 'cancelled') || 'completed';

        const externalOrderIdResult = convertToDataType(externalOrderIdRaw, 'text');
        const externalOrderId = (externalOrderIdResult.value as string) || '';

        // Validate email
        if (!email || !email.includes('@')) {
          errors.push('Invalid email address');
        }

        // Process line items
        const parsedLineItems: ParsedLineItem[] = [];
        let subtotalCents = 0;
        let feesCents = 0;

        const effectiveLineItems = lineItems.length > 0 ? lineItems : (selectedTicketTierId ? [
          createDefaultTicketLineItem(selectedTicketTierId, selectedTier?.name)
        ] : []);

        if (effectiveLineItems.length === 0) {
          errors.push('No line items configured and no default ticket tier selected');
        }

        for (const template of effectiveLineItems) {
          if (!checkLineItemCondition(template.condition, row)) {
            continue;
          }

          const quantity = resolveNumericValue(template.quantity, row, context, 1);
          if (quantity < 1) {
            errors.push(`Line item "${template.name}": Invalid quantity`);
            continue;
          }

          const unitPriceCents = resolveLineItemPrice(template, row, context);
          const unitFeeCents = resolveLineItemFee(template, row, context);
          const totalCents = quantity * (unitPriceCents + unitFeeCents);

          if (template.type === 'ticket' && !template.ticketTierId) {
            errors.push(`Line item "${template.name}": Ticket items must have a tier selected`);
            continue;
          }

          // Process sub-items
          const parsedSubItems: ParsedSubItem[] = [];
          if (template.subItems) {
            for (const subTemplate of template.subItems) {
              if (!checkLineItemCondition(subTemplate.condition, row)) {
                continue;
              }

              const subQuantity = quantity * subTemplate.quantityMultiplier;
              let subUnitPrice = 0;

              if (subTemplate.priceSource === 'product' && subTemplate.productId) {
                // TODO: Fetch product price
                subUnitPrice = 0;
              } else if (subTemplate.priceMapping) {
                subUnitPrice = resolveNumericValue(subTemplate.priceMapping, row, context);
              }

              parsedSubItems.push({
                templateId: subTemplate.id,
                name: subTemplate.name,
                type: subTemplate.type,
                productId: subTemplate.productId,
                quantity: subQuantity,
                unitPriceCents: subUnitPrice,
                totalCents: subQuantity * subUnitPrice,
              });

              subtotalCents += subQuantity * subUnitPrice;
            }
          }

          parsedLineItems.push({
            templateId: template.id,
            name: template.name,
            type: template.type,
            ticketTierId: template.ticketTierId,
            productId: template.productId,
            quantity,
            unitPriceCents,
            unitFeeCents,
            totalCents,
            subItems: parsedSubItems,
          });

          subtotalCents += quantity * unitPriceCents;
          feesCents += quantity * unitFeeCents;
        }

        if (parsedLineItems.length === 0 && errors.length === 0) {
          errors.push('No line items matched conditions for this row');
        }

        const totalCents = subtotalCents + feesCents;
        const isDuplicate = externalOrderId ? existingExternalIds.has(externalOrderId) : false;
        const existingUserId = email ? emailToUserId.get(email) || null : null;

        parsed.push({
          rowIndex: i + 2,
          customerEmail: email,
          customerName: name,
          lineItems: parsedLineItems,
          subtotalCents,
          feesCents,
          totalCents,
          orderDate,
          status,
          externalOrderId,
          validationErrors: errors,
          existingUserId,
          isDuplicate,
        });
      }

      onValidationComplete(parsed);
      onStepChange('preview');
    } catch (error) {
      logger.error('Error validating CSV data', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'useOrderValidation.validateOrders',
      });
      toast.error(t('orderCsvImport.errors.validationFailed'));
    } finally {
      setIsValidating(false);
    }
  }, [csvData, columnMapping, lineItems, selectedTier, selectedTicketTierId, ticketTiers, eventDetails, defaultOrderDate, t, onValidationComplete, onStepChange]);

  return { validateOrders };
}
