/**
 * Mock Order Generator Types
 *
 * Type definitions for the mock order generation system.
 */

import type { TicketTier } from '@/features/events/types';

/**
 * Configuration for generating mock orders
 */
export interface MockOrderConfig {
  eventId: string;

  /** Total number of orders to generate */
  totalOrders: number;

  /** Percentage of orders from registered users vs guests (0-100) */
  registeredUserRatio: number;

  /** Tier configuration - which tiers to include and quantities per order */
  tierSelections: TierSelection[];

  /** Whether to include ticket protection product */
  includeTicketProtection: boolean;

  /** Percentage of orders that include ticket protection (0-100) */
  ticketProtectionRatio: number;

  /** Start of date range for order creation dates (ISO string) */
  dateRangeStart: string;

  /** End of date range for order creation dates (ISO string) */
  dateRangeEnd: string;

  /** Distribution of order statuses */
  statusDistribution: OrderStatusDistribution;

  /** Optional: use specific user IDs for registered orders */
  specificUserIds?: string[];
}

/**
 * Tier selection configuration
 */
export interface TierSelection {
  tierId: string;
  tierName: string;
  /** Minimum tickets per order for this tier */
  minQuantity: number;
  /** Maximum tickets per order for this tier */
  maxQuantity: number;
  /** Relative weight for random selection (higher = more likely to be selected) */
  weight: number;
}

/**
 * Distribution of order statuses (percentages should sum to 100)
 */
export interface OrderStatusDistribution {
  /** Percentage of paid/completed orders */
  paid: number;
  /** Percentage of refunded orders */
  refunded: number;
  /** Percentage of cancelled orders */
  cancelled: number;
}

/**
 * Result from generating mock orders
 */
export interface MockOrderGenerationResult {
  success: boolean;
  ordersCreated: number;
  ticketsCreated: number;
  guestsCreated: number;
  errors: string[];
  orderIds: string[];
  executionTimeMs: number;
}

/**
 * Result from deleting mock orders
 */
export interface MockOrderDeletionResult {
  success: boolean;
  deletedOrders: number;
  deletedTickets: number;
  deletedOrderItems: number;
  deletedGuests: number;
  error?: string;
}

/**
 * Event summary for selection in the UI
 */
export interface TestEventSummary {
  id: string;
  title: string;
  status: 'test';
  start_time: string;
  venue?: {
    name: string;
  };
  ticketTiers: TicketTier[];
  mockOrderCount: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_MOCK_ORDER_CONFIG: Partial<MockOrderConfig> = {
  totalOrders: 50,
  registeredUserRatio: 30, // 30% registered users, 70% guests
  includeTicketProtection: true,
  ticketProtectionRatio: 40, // 40% of orders have protection
  statusDistribution: {
    paid: 90,
    refunded: 5,
    cancelled: 5,
  },
};

/**
 * Constants for mock order generation
 */
export const MOCK_ORDER_CONSTANTS = {
  /** UUID of the ticket protection product */
  TICKET_PROTECTION_PRODUCT_ID: '00000000-0000-0000-0000-000000000001',
  /** Price of ticket protection in cents */
  TICKET_PROTECTION_PRICE_CENTS: 500,
  /** Number of orders to process per batch */
  BATCH_SIZE: 20,
  /** Default fee percentage (basis points) */
  DEFAULT_FEE_BPS: 500, // 5%
};
