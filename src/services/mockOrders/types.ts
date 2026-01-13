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

  /** Whether to generate mock RSVPs (only if event has RSVP enabled) */
  generateRsvps?: boolean;

  /** Percentage of test users that should have RSVPs (0-100) */
  rsvpRatio?: number;

  /** Whether to generate mock interest records */
  generateInterests?: boolean;

  /** Percentage of test users that should mark interest (0-100) */
  interestRatio?: number;

  /** Number of unique test users to create (must be >= totalOrders) */
  testUserCount?: number;

  /** Override for ticket protection price in cents */
  ticketProtectionPriceCents?: number;

  /** Fee overrides for mock data generation (percentages) */
  feeOverrides?: {
    sales_tax?: number;
    processing_fee?: number;
    platform_fee?: number;
  };

  /** Whether to randomize order timestamps within the date range */
  randomizeOrderTimes?: boolean;

  /** Number of ticket groups to generate (each with at least one tier) */
  ticketGroupCount?: number;
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
  rsvpsCreated: number;
  interestsCreated: number;
  testProfilesCreated: number;
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
  deletedRsvps: number;
  deletedInterests: number;
  deletedTestProfiles: number;
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
  generateRsvps: true, // Generate RSVPs if event has RSVP enabled
  rsvpRatio: 60, // 60% of test users will RSVP
  generateInterests: true, // Generate interest records
  interestRatio: 40, // 40% of test users will mark interest
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

// ============================================================================
// PROGRESS TRACKING TYPES
// ============================================================================

/**
 * Generation phase identifiers
 */
export type GenerationPhase =
  | 'initializing'
  | 'creating_users'
  | 'creating_orders'
  | 'creating_rsvps'
  | 'creating_interests'
  | 'finalizing'
  | 'complete'
  | 'error';

/**
 * Individual step within a phase
 */
export interface GenerationStep {
  id: string;
  phase: GenerationPhase;
  label: string;
  current: number;
  total: number;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
  startedAt?: number;
  completedAt?: number;
}

/**
 * Overall progress state for mock order generation
 */
export interface GenerationProgress {
  /** Current phase of generation */
  phase: GenerationPhase;
  /** Overall progress percentage (0-100) */
  overallProgress: number;
  /** Detailed step tracking */
  steps: GenerationStep[];
  /** Cumulative counts */
  counts: {
    usersCreated: number;
    ordersCreated: number;
    ticketsCreated: number;
    guestsCreated: number;
    rsvpsCreated: number;
    interestsCreated: number;
  };
  /** Current log messages for live feed */
  logs: GenerationLogEntry[];
  /** Whether generation is complete */
  isComplete: boolean;
  /** Error message if failed */
  error?: string;
  /** Start time of generation */
  startedAt: number;
  /** End time of generation (if complete) */
  completedAt?: number;
}

/**
 * Log entry for the generation process
 */
export interface GenerationLogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Callback type for progress updates
 */
export type ProgressCallback = (progress: GenerationProgress) => void;

/**
 * Extended config that includes progress callback
 */
export interface MockOrderConfigWithProgress extends MockOrderConfig {
  /** Callback for progress updates during generation */
  onProgress?: ProgressCallback;
}

/**
 * Create initial progress state
 */
export function createInitialProgress(totalOrders: number, hasRsvps: boolean, hasInterests: boolean): GenerationProgress {
  const steps: GenerationStep[] = [
    {
      id: 'init',
      phase: 'initializing',
      label: 'Validating configuration',
      current: 0,
      total: 1,
      status: 'pending',
    },
    {
      id: 'users',
      phase: 'creating_users',
      label: 'Creating test users',
      current: 0,
      total: 0, // Will be set based on config
      status: 'pending',
    },
    {
      id: 'orders',
      phase: 'creating_orders',
      label: 'Generating orders',
      current: 0,
      total: totalOrders,
      status: 'pending',
    },
  ];

  if (hasRsvps) {
    steps.push({
      id: 'rsvps',
      phase: 'creating_rsvps',
      label: 'Creating RSVPs',
      current: 0,
      total: 0,
      status: 'pending',
    });
  }

  if (hasInterests) {
    steps.push({
      id: 'interests',
      phase: 'creating_interests',
      label: 'Recording interests',
      current: 0,
      total: 0,
      status: 'pending',
    });
  }

  steps.push({
    id: 'finalize',
    phase: 'finalizing',
    label: 'Finalizing',
    current: 0,
    total: 1,
    status: 'pending',
  });

  return {
    phase: 'initializing',
    overallProgress: 0,
    steps,
    counts: {
      usersCreated: 0,
      ordersCreated: 0,
      ticketsCreated: 0,
      guestsCreated: 0,
      rsvpsCreated: 0,
      interestsCreated: 0,
    },
    logs: [],
    isComplete: false,
    startedAt: Date.now(),
  };
}
