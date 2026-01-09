/**
 * Line Item Helpers
 *
 * Helper functions for working with line items:
 * - Condition checking
 * - Price/fee resolution
 * - Factory functions
 */

import { resolveNumericValue } from './fieldResolver';
import type {
  CsvRow,
  LineItemTemplate,
  LineItemCondition,
  ResolveContext,
} from '../types';

/**
 * Checks if a line item condition is satisfied for a given row
 */
export function checkLineItemCondition(
  condition: LineItemCondition | undefined,
  row: CsvRow
): boolean {
  if (!condition || condition.type === 'always') {
    return true;
  }

  if (condition.type === 'column_not_empty' && condition.column) {
    const value = row[condition.column]?.trim();
    return !!value && value.length > 0;
  }

  if (condition.type === 'column_equals' && condition.column) {
    const value = row[condition.column]?.trim();
    return value === condition.value;
  }

  return true;
}

/**
 * Resolves the price for a line item based on its price source
 */
export function resolveLineItemPrice(
  template: LineItemTemplate,
  row: CsvRow,
  context: ResolveContext
): number {
  switch (template.priceSource) {
    case 'tier':
      if (template.ticketTierId) {
        return context.tierPrices.get(template.ticketTierId) || 0;
      }
      return context.tierPrice;
    case 'product':
      // TODO: Fetch product price from database
      return 0;
    case 'column':
    case 'hardcoded':
    case 'formula':
      if (template.priceMapping) {
        return resolveNumericValue(template.priceMapping, row, context);
      }
      return 0;
    default:
      return 0;
  }
}

/**
 * Resolves the fee for a line item based on its fee source
 * Note: Fees should come from fee sub-items or explicit mapping, not auto-calculated
 */
export function resolveLineItemFee(
  template: LineItemTemplate,
  row: CsvRow,
  context: ResolveContext
): number {
  switch (template.feeSource) {
    case 'tier':
    case 'product':
      // Fees should be handled via fee sub-items, not auto-calculated
      return 0;
    case 'column':
    case 'hardcoded':
    case 'formula':
      if (template.feeMapping) {
        return resolveNumericValue(template.feeMapping, row, context);
      }
      return 0;
    default:
      return 0;
  }
}

/**
 * Creates a default ticket line item template
 * Note: Fees should be added as separate fee sub-items
 */
export function createDefaultTicketLineItem(tierId?: string, tierName?: string): LineItemTemplate {
  return {
    id: `line-item-${Date.now()}`,
    name: tierName || 'Ticket',
    type: 'ticket',
    ticketTierId: tierId,
    quantity: { mode: 'column', value: '', defaultValue: '1' },
    priceSource: 'tier',
    feeSource: 'hardcoded',
    feeMapping: { mode: 'hardcoded', value: '0' },
    condition: { type: 'always' },
  };
}

/**
 * Creates a default fee line item template
 */
export function createDefaultFeeLineItem(): LineItemTemplate {
  return {
    id: `line-item-${Date.now()}`,
    name: 'Service Fee',
    type: 'fee',
    quantity: { mode: 'hardcoded', value: '1' },
    priceSource: 'column',
    priceMapping: { mode: 'column', value: '' },
    feeSource: 'hardcoded',
    feeMapping: { mode: 'hardcoded', value: '0' },
    condition: { type: 'always' },
  };
}

/**
 * Creates a default sub-item template for ticket protection
 */
export function createDefaultProtectionSubItem(productId?: string) {
  return {
    id: `sub-item-${Date.now()}`,
    name: 'Ticket Protection',
    type: 'product' as const,
    productId: productId,
    quantityMultiplier: 1,
    priceSource: 'product' as const,
    condition: { type: 'column_not_empty' as const },
  };
}
