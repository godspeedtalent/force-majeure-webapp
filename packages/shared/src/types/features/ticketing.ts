/**
 * Centralized Ticketing Types
 *
 * Canonical type definitions for ticket tiers, selections, and checkout.
 * All ticketing-related components should import from this file.
 *
 * Note: The base TicketTier type is defined in @/features/events/types
 * This file provides additional ticketing-specific types.
 */

// Re-export the canonical TicketTier from events types
export type { TicketTier, TicketTierFormData } from '@/types/features/events';

/**
 * Ticket tier with order statistics
 * Used in analytics and management views
 */
export interface TicketTierWithStats {
  id: string;
  event_id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  total_tickets?: number;
  quantity_available?: number;
  quantity_sold?: number;
  revenue_cents?: number;
}

/**
 * Ticket selection in cart/checkout
 * Represents a user's selection of tickets for purchase
 */
export interface TicketSelection {
  tierId: string;
  tierName: string;
  quantity: number;
  pricePerTicket: number; // in cents
  feesPerTicket: number;  // in cents
}

/**
 * Extended ticket selection with tier details
 */
export interface TicketSelectionWithTier extends TicketSelection {
  tier: {
    id: string;
    name: string;
    description?: string | null;
    price_cents: number;
    fee_flat_cents?: number;
    fee_pct_bps?: number;
  };
}

/**
 * Summary of ticket selections for display
 */
export interface TicketSelectionSummary {
  tierName: string;
  quantity: number;
  subtotal: number; // in cents
  fees: number;     // in cents
  total: number;    // in cents
}

/**
 * Order summary for checkout
 */
export interface OrderSummary {
  items: TicketSelectionSummary[];
  subtotalCents: number;
  feesCents: number;
  totalCents: number;
  ticketCount: number;
}

/**
 * Ticket tier display option for selection UI
 */
export interface TicketTierOption {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  quantityAvailable: number;
  maxPerOrder?: number;
  isAvailable: boolean;
  soldOut?: boolean;
}

/**
 * Fee configuration for a ticket tier
 */
export interface TicketFees {
  flatFeeCents: number;
  percentageFeeBps: number; // basis points (100 bps = 1%)
}

/**
 * Calculate total fees for a given price
 */
export function calculateFees(priceCents: number, fees: TicketFees): number {
  const flatFee = fees.flatFeeCents;
  const percentageFee = Math.round((priceCents * fees.percentageFeeBps) / 10000);
  return flatFee + percentageFee;
}

/**
 * Calculate order summary from selections
 */
export function calculateOrderSummary(selections: TicketSelection[]): OrderSummary {
  const items: TicketSelectionSummary[] = selections
    .filter(s => s.quantity > 0)
    .map(s => ({
      tierName: s.tierName,
      quantity: s.quantity,
      subtotal: s.pricePerTicket * s.quantity,
      fees: s.feesPerTicket * s.quantity,
      total: (s.pricePerTicket + s.feesPerTicket) * s.quantity,
    }));

  return {
    items,
    subtotalCents: items.reduce((sum, item) => sum + item.subtotal, 0),
    feesCents: items.reduce((sum, item) => sum + item.fees, 0),
    totalCents: items.reduce((sum, item) => sum + item.total, 0),
    ticketCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

/**
 * Ticket tier status
 */
export type TicketTierStatus = 'available' | 'sold_out' | 'not_yet_available' | 'sales_ended';

/**
 * Get the status of a ticket tier
 */
export function getTicketTierStatus(
  tier: { quantity_available?: number; sales_start_date?: string | null; sales_end_date?: string | null },
  now = new Date()
): TicketTierStatus {
  if (tier.sales_start_date && new Date(tier.sales_start_date) > now) {
    return 'not_yet_available';
  }
  if (tier.sales_end_date && new Date(tier.sales_end_date) < now) {
    return 'sales_ended';
  }
  if (tier.quantity_available !== undefined && tier.quantity_available <= 0) {
    return 'sold_out';
  }
  return 'available';
}
