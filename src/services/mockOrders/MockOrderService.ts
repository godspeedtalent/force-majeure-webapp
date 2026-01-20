/**
 * Mock Order Service
 *
 * Service for generating and managing mock order data for test events.
 * Extends TestDataService for access to randomization utilities.
 */

import { supabase } from '@/shared';
import { logger } from '@/shared/services/logger';
import { environmentService } from '@/shared';
import { TestDataService } from '@/services/testData/TestDataService';
import type { TicketTier } from '@/features/events/types';
import type {
  MockOrderConfig,
  MockOrderConfigWithProgress,
  MockOrderGenerationResult,
  MockOrderDeletionResult,
  TierSelection,
  TestEventSummary,
  OrderStatusDistribution,
  GenerationLogEntry,
} from './types';
import { MOCK_ORDER_CONSTANTS, createInitialProgress } from './types';

/**
 * Fee from ticketing_fees table
 */
interface TicketingFee {
  id: string;
  fee_name: string;
  fee_type: 'flat' | 'percentage';
  fee_value: number;
  is_active: boolean;
  environment_id: string;
}

/**
 * Fee breakdown entry for order storage
 */
interface FeeBreakdownEntry {
  name: string;
  type: 'flat' | 'percentage';
  value: number;
  amount_cents: number;
}

/**
 * Fee calculation result
 */
interface FeeCalculationResult {
  fees: FeeBreakdownEntry[];
  total_fees_cents: number;
  fee_breakdown: Record<string, number>;
}

// Fake name pools for guest generation
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
  'Parker', 'Blake', 'Cameron', 'Drew', 'Jamie', 'Skyler', 'Reese', 'Dakota',
  'Peyton', 'Sage', 'Finley', 'Rowan', 'Harper', 'Emerson', 'Kendall', 'Phoenix',
  'Hayden', 'Charlie', 'River', 'Jessie', 'Sam', 'Robin', 'Pat', 'Lee',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson',
  'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams',
];

const EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'protonmail.com',
  'icloud.com', 'aol.com', 'mail.com', 'zoho.com', 'fastmail.com',
];

/**
 * Internal type for prepared order data before insertion
 */
interface PreparedOrderData {
  isRegisteredUser: boolean;
  userId: string | null;
  userEmail: string;
  guestName: string | null;
  orderDate: string;
  tierId: string;
  tierPrice: number;
  ticketQuantity: number;
  hasProtection: boolean;
  status: 'paid' | 'refunded' | 'cancelled';
  subtotalCents: number;
  feesCents: number;
  totalCents: number;
  feeBreakdown: Record<string, number>;
}

/**
 * Internal type for test order item insertion
 */
interface TestOrderItemInsert {
  test_order_id: string;
  item_type: 'ticket' | 'product';
  ticket_tier_id?: string;
  product_id?: string;
  quantity: number;
  unit_price_cents: number;
  unit_fee_cents: number;
}

/**
 * Batch result type
 */
interface BatchResult {
  ordersCreated: number;
  ticketsCreated: number;
  guestsCreated: number;
  orderIds: string[];
  errors: string[];
}

export class MockOrderService extends TestDataService {
  /**
   * Generate mock orders for a test event
   */
  async generateMockOrders(config: MockOrderConfig): Promise<MockOrderGenerationResult> {
    const startTime = Date.now();
    const result: MockOrderGenerationResult = {
      success: false,
      ordersCreated: 0,
      ticketsCreated: 0,
      guestsCreated: 0,
      rsvpsCreated: 0,
      interestsCreated: 0,
      testProfilesCreated: 0,
      errors: [],
      orderIds: [],
      executionTimeMs: 0,
    };

    try {
      // Validate event is in test status and get RSVP config
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, status, title, rsvp_capacity')
        .eq('id', config.eventId)
        .single();

      if (eventError || !event) {
        throw new Error('Event not found');
      }

      if (event.status !== 'test') {
        throw new Error(`Event must be in 'test' status to generate mock orders. Current status: ${event.status}`);
      }

      // Get ticket tiers for validation
      const { data: tiers, error: tiersError } = await supabase
        .from('ticket_tiers')
        .select('*')
        .eq('event_id', config.eventId);

      if (tiersError || !tiers?.length) {
        throw new Error('No ticket tiers found for this event');
      }

      // Validate tier selections
      const validTierIds = new Set(tiers.map(t => t.id));
      for (const selection of config.tierSelections) {
        if (!validTierIds.has(selection.tierId)) {
          throw new Error(`Invalid tier ID: ${selection.tierId}`);
        }
      }

      // Fetch ticketing fees from database
      const ticketingFees = await this.fetchTicketingFees();
      logger.info('Using ticketing fees for mock orders', {
        feeCount: ticketingFees.length,
        fees: ticketingFees.map(f => ({ name: f.fee_name, type: f.fee_type, value: f.fee_value })),
        source: 'MockOrderService.generateMockOrders',
      });

      // Create test users if needed (instead of using existing users)
      let testUsers: Array<{ id: string; user_id: string; email: string }> = [];
      const registeredOrderCount = Math.floor(config.totalOrders * (config.registeredUserRatio / 100));

      if (registeredOrderCount > 0) {
        // Create test profiles for mock orders instead of using real users
        testUsers = await this.createTestProfiles(registeredOrderCount);

        result.testProfilesCreated = testUsers.length;

        logger.info('Created test profiles for mock orders', {
          count: testUsers.length,
          eventId: config.eventId,
          source: 'MockOrderService.generateMockOrders',
        });
      }

      // Generate orders in batches
      const ordersToCreate = this.prepareOrderData(config, testUsers, tiers as TicketTier[], ticketingFees);

      for (let i = 0; i < ordersToCreate.length; i += MOCK_ORDER_CONSTANTS.BATCH_SIZE) {
        const batch = ordersToCreate.slice(i, i + MOCK_ORDER_CONSTANTS.BATCH_SIZE);
        const batchResult = await this.createOrderBatch(batch, config);

        result.ordersCreated += batchResult.ordersCreated;
        result.ticketsCreated += batchResult.ticketsCreated;
        result.guestsCreated += batchResult.guestsCreated;
        result.orderIds.push(...batchResult.orderIds);
        result.errors.push(...batchResult.errors);
      }

      // Generate RSVPs if config says to (for test data, we generate regardless of event RSVP capacity)
      if (config.generateRsvps && testUsers.length > 0) {
        const rsvpResult = await this.generateMockRsvps(
          config.eventId,
          testUsers,
          config.rsvpRatio ?? 60
        );
        result.rsvpsCreated = rsvpResult.created;
        if (rsvpResult.error) {
          result.errors.push(rsvpResult.error);
        }
      }

      // Generate interests if config says to
      if (config.generateInterests && testUsers.length > 0) {
        const interestResult = await this.generateMockInterests(
          config.eventId,
          testUsers,
          config.interestRatio ?? 40
        );
        result.interestsCreated = interestResult.created;
        if (interestResult.error) {
          result.errors.push(interestResult.error);
        }
      }

      result.success = result.errors.length === 0;
      result.executionTimeMs = Date.now() - startTime;

      logger.info('Mock order generation completed', {
        eventId: config.eventId,
        ordersCreated: result.ordersCreated,
        ticketsCreated: result.ticketsCreated,
        rsvpsCreated: result.rsvpsCreated,
        interestsCreated: result.interestsCreated,
        testProfilesCreated: result.testProfilesCreated,
        executionTimeMs: result.executionTimeMs,
        source: 'MockOrderService.generateMockOrders',
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      result.executionTimeMs = Date.now() - startTime;

      logger.error('Error generating mock orders', {
        error: errorMessage,
        eventId: config.eventId,
        source: 'MockOrderService.generateMockOrders',
      });

      return result;
    }
  }

  /**
   * Generate mock orders with progress tracking
   * This is the preferred method for UI integration as it provides real-time feedback
   */
  async generateMockOrdersWithProgress(
    config: MockOrderConfigWithProgress
  ): Promise<MockOrderGenerationResult> {
    const { onProgress, ...baseConfig } = config;
    const startTime = Date.now();

    // Helper to create log entries
    const createLog = (
      level: GenerationLogEntry['level'],
      message: string,
      details?: Record<string, unknown>
    ): GenerationLogEntry => ({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level,
      message,
      details,
    });

    // Initialize progress state
    const hasRsvps = config.generateRsvps ?? true;
    const hasInterests = config.generateInterests ?? true;
    let progress = createInitialProgress(config.totalOrders, hasRsvps, hasInterests);

    // Helper to emit progress updates
    const emitProgress = () => {
      if (onProgress) {
        // Calculate overall progress
        const completedSteps = progress.steps.filter(s => s.status === 'completed').length;
        const inProgressStep = progress.steps.find(s => s.status === 'in_progress');
        let stepProgress = 0;
        if (inProgressStep && inProgressStep.total > 0) {
          stepProgress = (inProgressStep.current / inProgressStep.total) / progress.steps.length;
        }
        progress.overallProgress = Math.min(
          100,
          Math.round((completedSteps / progress.steps.length) * 100 + stepProgress * 100)
        );
        onProgress({ ...progress });
      }
    };

    // Helper to update step
    const updateStep = (
      stepId: string,
      updates: Partial<{ current: number; total: number; status: 'pending' | 'in_progress' | 'completed' | 'error'; message: string }>
    ) => {
      progress.steps = progress.steps.map(step =>
        step.id === stepId
          ? {
              ...step,
              ...updates,
              startedAt: updates.status === 'in_progress' ? Date.now() : step.startedAt,
              completedAt: updates.status === 'completed' ? Date.now() : step.completedAt,
            }
          : step
      );
      emitProgress();
    };

    // Helper to add log
    const addLog = (level: GenerationLogEntry['level'], message: string, details?: Record<string, unknown>) => {
      progress.logs = [...progress.logs.slice(-49), createLog(level, message, details)]; // Keep last 50 logs
      emitProgress();
    };

    const result: MockOrderGenerationResult = {
      success: false,
      ordersCreated: 0,
      ticketsCreated: 0,
      guestsCreated: 0,
      rsvpsCreated: 0,
      interestsCreated: 0,
      testProfilesCreated: 0,
      errors: [],
      orderIds: [],
      executionTimeMs: 0,
    };

    try {
      // Phase: Initializing
      progress.phase = 'initializing';
      updateStep('init', { status: 'in_progress', current: 0 });
      addLog('info', 'Starting mock order generation...');

      // Validate event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, status, title, rsvp_capacity')
        .eq('id', config.eventId)
        .single();

      if (eventError || !event) {
        throw new Error('Event not found');
      }

      if (event.status !== 'test') {
        throw new Error(`Event must be in 'test' status. Current: ${event.status}`);
      }

      addLog('success', `Validated event: ${event.title}`);

      // Get ticket tiers
      const { data: tiers, error: tiersError } = await supabase
        .from('ticket_tiers')
        .select('*')
        .eq('event_id', config.eventId);

      if (tiersError || !tiers?.length) {
        throw new Error('No ticket tiers found');
      }

      addLog('info', `Found ${tiers.length} ticket tier(s)`);

      // Validate tier selections
      const validTierIds = new Set(tiers.map(t => t.id));
      for (const selection of config.tierSelections) {
        if (!validTierIds.has(selection.tierId)) {
          throw new Error(`Invalid tier ID: ${selection.tierId}`);
        }
      }

      // Fetch ticketing fees from database
      const ticketingFees = await this.fetchTicketingFees();
      addLog('info', `Loaded ${ticketingFees.length} ticketing fee(s)`, {
        fees: ticketingFees.map(f => f.fee_name),
      });

      updateStep('init', { status: 'completed', current: 1 });
      addLog('success', 'Configuration validated');

      // Phase: Creating Users
      progress.phase = 'creating_users';
      const registeredOrderCount = Math.floor(config.totalOrders * (config.registeredUserRatio / 100));
      updateStep('users', { status: 'in_progress', total: registeredOrderCount, current: 0 });

      let testUsers: Array<{ id: string; user_id: string; email: string }> = [];

      if (registeredOrderCount > 0) {
        addLog('info', `Creating ${registeredOrderCount} test user profile(s)...`);

        let profileErrors = 0;

        // Create profiles with progress updates using test_profiles table
        for (let i = 0; i < registeredOrderCount; i++) {
          const email = this.generateTestEmail();
          const displayName = this.generateFakeName();

          // Use test_profiles table instead of profiles (no FK to auth.users)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profile, error } = await (supabase as any)
            .from('test_profiles')
            .insert({
              email,
              display_name: displayName,
            })
            .select('id, email')
            .single();

          if (error) {
            profileErrors++;
            // Log first error for debugging
            if (profileErrors === 1) {
              addLog('warning', `Profile creation error: ${error.message}`);
              logger.warn('Test profile creation failed', {
                error: error.message,
                code: error.code,
                source: 'MockOrderService.generateMockOrdersWithProgress',
              });
            }
          } else if (profile) {
            testUsers.push({
              id: profile.id,
              user_id: profile.id,
              email: profile.email || email,
            });
            progress.counts.usersCreated++;
          }

          updateStep('users', { current: i + 1 });
        }

        result.testProfilesCreated = testUsers.length;
        if (profileErrors > 0) {
          addLog('warning', `${profileErrors} profile(s) failed to create. RSVPs/interests require profiles.`);
        }
        addLog('success', `Created ${testUsers.length} test user profile(s)`, { count: testUsers.length });
      } else {
        addLog('info', 'Skipping user creation (guest orders only)');
      }

      updateStep('users', { status: 'completed' });

      // Phase: Creating Orders
      progress.phase = 'creating_orders';
      updateStep('orders', { status: 'in_progress', current: 0 });
      addLog('info', `Generating ${config.totalOrders} mock order(s)...`);

      const ordersToCreate = this.prepareOrderData(baseConfig, testUsers, tiers as TicketTier[], ticketingFees);

      for (let i = 0; i < ordersToCreate.length; i += MOCK_ORDER_CONSTANTS.BATCH_SIZE) {
        const batch = ordersToCreate.slice(i, i + MOCK_ORDER_CONSTANTS.BATCH_SIZE);
        const batchResult = await this.createOrderBatch(batch, baseConfig);

        result.ordersCreated += batchResult.ordersCreated;
        result.ticketsCreated += batchResult.ticketsCreated;
        result.guestsCreated += batchResult.guestsCreated;
        result.orderIds.push(...batchResult.orderIds);
        result.errors.push(...batchResult.errors);

        progress.counts.ordersCreated = result.ordersCreated;
        progress.counts.ticketsCreated = result.ticketsCreated;
        progress.counts.guestsCreated = result.guestsCreated;

        const processed = Math.min(i + MOCK_ORDER_CONSTANTS.BATCH_SIZE, ordersToCreate.length);
        updateStep('orders', { current: processed });

        if (batchResult.errors.length > 0) {
          // Log first few unique errors for debugging
          const uniqueErrors = [...new Set(batchResult.errors)].slice(0, 3);
          addLog('warning', `Batch ${Math.floor(i / MOCK_ORDER_CONSTANTS.BATCH_SIZE) + 1}: ${batchResult.errors.length} error(s)`, {
            sampleErrors: uniqueErrors,
          });
          logger.warn('Batch order creation errors', {
            batchNumber: Math.floor(i / MOCK_ORDER_CONSTANTS.BATCH_SIZE) + 1,
            errorCount: batchResult.errors.length,
            uniqueErrors,
            source: 'MockOrderService.generateMockOrdersWithProgress',
          });
        }
      }

      updateStep('orders', { status: 'completed' });
      addLog('success', `Created ${result.ordersCreated} order(s), ${result.ticketsCreated} ticket(s)`, {
        orders: result.ordersCreated,
        tickets: result.ticketsCreated,
        guests: result.guestsCreated,
      });

      // Phase: Creating RSVPs (for test data, we generate regardless of event RSVP capacity)
      if (config.generateRsvps && testUsers.length > 0) {
        progress.phase = 'creating_rsvps';
        const expectedRsvps = Math.round(testUsers.length * ((config.rsvpRatio ?? 60) / 100));
        updateStep('rsvps', { status: 'in_progress', total: expectedRsvps, current: 0 });
        addLog('info', `Creating ~${expectedRsvps} RSVP(s)...`);

        const rsvpResult = await this.generateMockRsvps(
          config.eventId,
          testUsers,
          config.rsvpRatio ?? 60
        );

        result.rsvpsCreated = rsvpResult.created;
        progress.counts.rsvpsCreated = rsvpResult.created;

        if (rsvpResult.error) {
          result.errors.push(rsvpResult.error);
          addLog('warning', rsvpResult.error);
        } else {
          addLog('success', `Created ${rsvpResult.created} RSVP(s)`);
        }

        updateStep('rsvps', { status: 'completed', current: rsvpResult.created });
      }

      // Phase: Creating Interests
      if (config.generateInterests && testUsers.length > 0) {
        progress.phase = 'creating_interests';
        const expectedInterests = Math.round(testUsers.length * ((config.interestRatio ?? 40) / 100));
        updateStep('interests', { status: 'in_progress', total: expectedInterests, current: 0 });
        addLog('info', `Creating ~${expectedInterests} interest record(s)...`);

        const interestResult = await this.generateMockInterests(
          config.eventId,
          testUsers,
          config.interestRatio ?? 40
        );

        result.interestsCreated = interestResult.created;
        progress.counts.interestsCreated = interestResult.created;

        if (interestResult.error) {
          result.errors.push(interestResult.error);
          addLog('warning', interestResult.error);
        } else {
          addLog('success', `Created ${interestResult.created} interest record(s)`);
        }

        updateStep('interests', { status: 'completed', current: interestResult.created });
      }

      // Phase: Finalizing
      progress.phase = 'finalizing';
      updateStep('finalize', { status: 'in_progress', current: 0 });

      result.success = result.errors.length === 0;
      result.executionTimeMs = Date.now() - startTime;

      updateStep('finalize', { status: 'completed', current: 1 });

      // Complete
      progress.phase = 'complete';
      progress.isComplete = true;
      progress.completedAt = Date.now();
      progress.overallProgress = 100;

      const duration = (result.executionTimeMs / 1000).toFixed(1);
      addLog('success', `Generation complete in ${duration}s`, {
        orders: result.ordersCreated,
        tickets: result.ticketsCreated,
        users: result.testProfilesCreated,
        rsvps: result.rsvpsCreated,
        interests: result.interestsCreated,
      });

      emitProgress();

      logger.info('Mock order generation with progress completed', {
        eventId: config.eventId,
        ordersCreated: result.ordersCreated,
        ticketsCreated: result.ticketsCreated,
        executionTimeMs: result.executionTimeMs,
        source: 'MockOrderService.generateMockOrdersWithProgress',
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      result.executionTimeMs = Date.now() - startTime;

      // Update progress to error state
      progress.phase = 'error';
      progress.error = errorMessage;
      progress.isComplete = true;
      progress.completedAt = Date.now();

      addLog('error', `Generation failed: ${errorMessage}`);
      emitProgress();

      logger.error('Error in mock order generation with progress', {
        error: errorMessage,
        eventId: config.eventId,
        source: 'MockOrderService.generateMockOrdersWithProgress',
      });

      return result;
    }
  }

  /**
   * Delete all mock orders for an event
   */
  async deleteMockOrdersByEvent(eventId: string): Promise<MockOrderDeletionResult> {
    try {
      // Use the database function for atomic deletion
      // Type assertion needed until database types are regenerated
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('delete_mock_orders_by_event', {
        p_event_id: eventId,
      });

      if (error) {
        throw new Error(error.message);
      }

      const resultRow = Array.isArray(data) ? data[0] : data;
      const deletionResult = resultRow || {
        deleted_tickets: 0,
        deleted_order_items: 0,
        deleted_orders: 0,
        deleted_guests: 0,
        deleted_rsvps: 0,
        deleted_interests: 0,
        deleted_test_profiles: 0,
        deleted_test_tickets: 0,
        deleted_test_order_items: 0,
        deleted_test_orders: 0,
      };

      logger.info('Mock orders deleted', {
        eventId,
        deleted_test_orders: deletionResult.deleted_test_orders,
        deleted_test_tickets: deletionResult.deleted_test_tickets,
        deleted_legacy_orders: deletionResult.deleted_orders,
        deleted_legacy_tickets: deletionResult.deleted_tickets,
        source: 'MockOrderService.deleteMockOrdersByEvent',
      });

      return {
        success: true,
        // Legacy production table deletions (backward compatibility)
        deletedOrders: deletionResult.deleted_orders ?? 0,
        deletedTickets: deletionResult.deleted_tickets ?? 0,
        deletedOrderItems: deletionResult.deleted_order_items ?? 0,
        deletedGuests: deletionResult.deleted_guests ?? 0,
        // Test table deletions
        deletedRsvps: deletionResult.deleted_rsvps ?? 0,
        deletedInterests: deletionResult.deleted_interests ?? 0,
        deletedTestProfiles: deletionResult.deleted_test_profiles ?? 0,
        deletedTestOrders: deletionResult.deleted_test_orders ?? 0,
        deletedTestOrderItems: deletionResult.deleted_test_order_items ?? 0,
        deletedTestTickets: deletionResult.deleted_test_tickets ?? 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Error deleting mock orders', {
        error: errorMessage,
        eventId,
        source: 'MockOrderService.deleteMockOrdersByEvent',
      });

      return {
        success: false,
        deletedOrders: 0,
        deletedTickets: 0,
        deletedOrderItems: 0,
        deletedGuests: 0,
        deletedRsvps: 0,
        deletedInterests: 0,
        deletedTestProfiles: 0,
        deletedTestOrders: 0,
        deletedTestOrderItems: 0,
        deletedTestTickets: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Get test events with mock order summary
   */
  async getTestEventsWithSummary(): Promise<TestEventSummary[]> {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        status,
        start_time,
        venue:venues(name),
        ticket_tiers(*)
      `)
      .eq('status', 'test')
      .order('start_time', { ascending: true });

    if (error || !events) {
      logger.error('Error fetching test events', {
        error: error?.message,
        source: 'MockOrderService.getTestEventsWithSummary',
      });
      return [];
    }

    // Get mock order counts for each event from test_orders table
    const eventIds = events.map(e => e.id);

    if (eventIds.length === 0) {
      return [];
    }

    // Query test_orders table (dedicated test data table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orderCounts } = await (supabase as any)
      .from('test_orders')
      .select('event_id')
      .in('event_id', eventIds);

    const countMap = new Map<string, number>();
    (orderCounts || []).forEach((o: { event_id: string }) => {
      countMap.set(o.event_id, (countMap.get(o.event_id) || 0) + 1);
    });

    return events.map(event => ({
      id: event.id,
      title: event.title,
      status: 'test' as const,
      start_time: event.start_time || '',
      venue: event.venue as { name: string } | undefined,
      ticketTiers: (event.ticket_tiers || []) as TicketTier[],
      mockOrderCount: countMap.get(event.id) || 0,
    }));
  }

  /**
   * Get a single event for the mock generator (including non-test events for context)
   */
  async getEventForMockGenerator(eventId: string): Promise<TestEventSummary | null> {
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        id,
        title,
        status,
        start_time,
        venue:venues(name),
        ticket_tiers(*)
      `)
      .eq('id', eventId)
      .single();

    if (error || !event) {
      return null;
    }

    // Get mock order count from test_orders table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from('test_orders')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    return {
      id: event.id,
      title: event.title,
      status: event.status as 'test',
      start_time: event.start_time || '',
      venue: event.venue as { name: string } | undefined,
      ticketTiers: (event.ticket_tiers || []) as TicketTier[],
      mockOrderCount: count || 0,
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private prepareOrderData(
    config: MockOrderConfig,
    testUsers: Array<{ id: string; user_id: string; email: string }>,
    tiers: TicketTier[],
    ticketingFees: TicketingFee[]
  ): PreparedOrderData[] {
    const orders: PreparedOrderData[] = [];
    const registeredOrderCount = Math.floor(config.totalOrders * (config.registeredUserRatio / 100));

    // Create tier lookup with available capacity tracking
    const tierMap = new Map(tiers.map(t => [t.id, t]));

    // Track remaining capacity per tier (available_inventory or total_tickets - sold)
    const tierCapacity = new Map<string, number>();
    for (const tier of tiers) {
      const available = tier.available_inventory ?? (tier.total_tickets ?? 0) - (tier.sold_inventory ?? 0);
      tierCapacity.set(tier.id, Math.max(0, available));
    }

    for (let i = 0; i < config.totalOrders; i++) {
      // Filter tier selections to only those with remaining capacity
      const availableSelections = config.tierSelections.filter(selection => {
        const remaining = tierCapacity.get(selection.tierId) ?? 0;
        return remaining >= selection.minQuantity;
      });

      // If no tiers have capacity, stop generating orders
      if (availableSelections.length === 0) {
        logger.warn('Mock order generation stopped early - all tiers at capacity', {
          ordersGenerated: orders.length,
          totalRequested: config.totalOrders,
          source: 'MockOrderService.prepareOrderData',
        });
        break;
      }

      const isRegisteredUser = i < registeredOrderCount && testUsers.length > 0;
      const testUser = isRegisteredUser
        ? this.randomElement(testUsers)
        : null;

      // Generate order date within range
      const orderDate = this.randomDateInRange(config.dateRangeStart, config.dateRangeEnd);

      // Select random tier based on weights (only from available tiers)
      const selectedTier = this.selectTierByWeight(availableSelections);
      const tier = tierMap.get(selectedTier.tierId);
      if (!tier) continue;

      // Get remaining capacity for this tier
      const remainingCapacity = tierCapacity.get(selectedTier.tierId) ?? 0;

      // Random quantity within tier selection range, but capped by remaining capacity
      const maxQuantity = Math.min(selectedTier.maxQuantity, remainingCapacity);
      const minQuantity = Math.min(selectedTier.minQuantity, maxQuantity);

      // Skip if we can't meet minimum quantity
      if (minQuantity <= 0 || maxQuantity < minQuantity) {
        continue;
      }

      const ticketQuantity = this.randomInt(minQuantity, maxQuantity);

      // Deduct from tier capacity
      tierCapacity.set(selectedTier.tierId, remainingCapacity - ticketQuantity);

      // Determine status based on distribution
      const status = this.selectStatus(config.statusDistribution);

      // Calculate protection
      const hasProtection = config.includeTicketProtection &&
        this.randomBoolean(config.ticketProtectionRatio / 100);

      // Calculate totals
      const ticketSubtotal = tier.price_cents * ticketQuantity;
      const protectionTotal = hasProtection ? MOCK_ORDER_CONSTANTS.TICKET_PROTECTION_PRICE_CENTS * ticketQuantity : 0;
      const subtotal = ticketSubtotal + protectionTotal;

      // Calculate fees using actual site fees (with sales tax applied to fees too)
      const feeResult = this.calculateFeesWithTax(subtotal, ticketingFees);
      const total = subtotal + feeResult.total_fees_cents;

      orders.push({
        isRegisteredUser,
        userId: testUser?.user_id || null,
        userEmail: testUser?.email || this.generateFakeEmail(),
        guestName: isRegisteredUser ? null : this.generateFakeName(),
        orderDate,
        tierId: selectedTier.tierId,
        tierPrice: tier.price_cents,
        ticketQuantity,
        hasProtection,
        status,
        subtotalCents: subtotal,
        feesCents: feeResult.total_fees_cents,
        totalCents: total,
        feeBreakdown: feeResult.fee_breakdown,
      });
    }

    return orders;
  }

  private async createOrderBatch(
    orders: PreparedOrderData[],
    config: MockOrderConfig
  ): Promise<BatchResult> {
    const result: BatchResult = {
      ordersCreated: 0,
      ticketsCreated: 0,
      guestsCreated: 0,
      orderIds: [],
      errors: [],
    };

    for (const orderData of orders) {
      try {
        let guestId: string | null = null;

        // Create guest if needed (for non-registered users)
        if (!orderData.isRegisteredUser) {
          const { data: guest, error: guestError } = await supabase
            .from('guests')
            .insert({
              email: orderData.userEmail,
              full_name: orderData.guestName,
            })
            .select('id')
            .single();

          if (guestError) {
            result.errors.push(`Guest creation failed: ${guestError.message}`);
            continue;
          }
          guestId = guest.id;
          result.guestsCreated++;
        }

        // Create test order in test_orders table (not production orders)
        // Uses test_profile_id instead of user_id to avoid auth.users FK constraint
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: order, error: orderError } = await (supabase as any)
          .from('test_orders')
          .insert({
            event_id: config.eventId,
            test_profile_id: orderData.userId, // This is actually a test_profile.id
            guest_id: guestId,
            customer_email: orderData.userEmail,
            status: orderData.status,
            subtotal_cents: orderData.subtotalCents,
            fees_cents: orderData.feesCents,
            total_cents: orderData.totalCents,
            fee_breakdown: orderData.feeBreakdown,
            currency: 'usd',
            created_at: orderData.orderDate,
          })
          .select('id')
          .single();

        if (orderError) {
          result.errors.push(`Order creation failed: ${orderError.message}`);
          continue;
        }

        result.ordersCreated++;
        result.orderIds.push(order.id);

        // Create test order items in test_order_items table
        const orderItems: TestOrderItemInsert[] = [{
          test_order_id: order.id,
          item_type: 'ticket',
          ticket_tier_id: orderData.tierId,
          quantity: orderData.ticketQuantity,
          unit_price_cents: orderData.tierPrice,
          unit_fee_cents: 0, // Fees tracked at order level
        }];

        if (orderData.hasProtection) {
          orderItems.push({
            test_order_id: order.id,
            item_type: 'product',
            product_id: MOCK_ORDER_CONSTANTS.TICKET_PROTECTION_PRODUCT_ID,
            quantity: orderData.ticketQuantity,
            unit_price_cents: MOCK_ORDER_CONSTANTS.TICKET_PROTECTION_PRICE_CENTS,
            unit_fee_cents: 0,
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: createdItems, error: itemsError } = await (supabase as any)
          .from('test_order_items')
          .insert(orderItems)
          .select('id');

        if (itemsError || !createdItems?.length) {
          result.errors.push(`Order items creation failed: ${itemsError?.message || 'Unknown'}`);
          continue;
        }

        // Create test tickets in test_tickets table - one per quantity
        const ticketOrderItem = createdItems[0];
        const ticketStatus = orderData.status === 'paid' ? 'valid' : orderData.status;

        const tickets = Array.from({ length: orderData.ticketQuantity }, (_, idx) => ({
          test_order_id: order.id,
          test_order_item_id: ticketOrderItem.id,
          ticket_tier_id: orderData.tierId,
          event_id: config.eventId,
          attendee_name: orderData.guestName || null,
          attendee_email: orderData.userEmail,
          qr_code_data: `TEST-${order.id}-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          status: ticketStatus,
          has_protection: orderData.hasProtection,
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: createdTickets, error: ticketsError } = await (supabase as any)
          .from('test_tickets')
          .insert(tickets)
          .select('id');

        if (ticketsError) {
          result.errors.push(`Tickets creation failed: ${ticketsError.message}`);
          continue;
        }

        result.ticketsCreated += createdTickets?.length || 0;
      } catch (error) {
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return result;
  }

  /**
   * Create test profiles for mock orders
   * Uses dedicated test_profiles table that doesn't require auth.users
   */
  private async createTestProfiles(
    count: number
  ): Promise<Array<{ id: string; user_id: string; email: string }>> {
    const testProfiles: Array<{ id: string; user_id: string; email: string }> = [];

    for (let i = 0; i < count; i++) {
      const email = this.generateTestEmail();
      const displayName = this.generateFakeName();

      // Create a test profile in the dedicated test_profiles table
      // This table has no FK constraint to auth.users
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error } = await (supabase as any)
        .from('test_profiles')
        .insert({
          email,
          display_name: displayName,
        })
        .select('id, email')
        .single();

      if (error) {
        logger.warn('Failed to create test profile', {
          error: error.message,
          source: 'MockOrderService.createTestProfiles',
        });
        continue;
      }

      if (profile) {
        testProfiles.push({
          id: profile.id,
          user_id: profile.id, // For test profiles, id serves as user_id
          email: profile.email || email,
        });
      }
    }

    return testProfiles;
  }

  /**
   * Generate a test email that's clearly identifiable as test data
   */
  private generateTestEmail(): string {
    const firstName = this.randomElement(FIRST_NAMES).toLowerCase();
    const lastName = this.randomElement(LAST_NAMES).toLowerCase();
    const number = this.randomInt(1, 9999);
    const timestamp = Date.now().toString(36);
    // Use a clearly fake domain to identify test users
    return `test.${firstName}.${lastName}${number}.${timestamp}@test.forcemajeure.local`;
  }

  /**
   * Generate mock RSVPs for test users
   * Uses test_event_rsvps table which links to test_profiles
   */
  private async generateMockRsvps(
    eventId: string,
    testUsers: Array<{ id: string; user_id: string; email: string }>,
    rsvpRatio: number
  ): Promise<{ created: number; error?: string }> {
    try {
      const usersToRsvp = testUsers.filter(() => this.randomBoolean(rsvpRatio / 100));

      if (usersToRsvp.length === 0) {
        return { created: 0 };
      }

      const rsvps = usersToRsvp.map(user => ({
        event_id: eventId,
        test_profile_id: user.id,
        status: 'confirmed' as const,
      }));

      // Use test_event_rsvps table instead of event_rsvps
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('test_event_rsvps')
        .insert(rsvps)
        .select('id');

      if (error) {
        throw new Error(error.message);
      }

      logger.info('Created mock RSVPs', {
        count: data?.length ?? 0,
        eventId,
        source: 'MockOrderService.generateMockRsvps',
      });

      return { created: data?.length ?? 0 };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to generate mock RSVPs', {
        error: message,
        eventId,
        source: 'MockOrderService.generateMockRsvps',
      });
      return { created: 0, error: `RSVP generation failed: ${message}` };
    }
  }

  /**
   * Generate mock interest records for test users
   * Uses test_event_interests table which links to test_profiles
   */
  private async generateMockInterests(
    eventId: string,
    testUsers: Array<{ id: string; user_id: string; email: string }>,
    interestRatio: number
  ): Promise<{ created: number; error?: string }> {
    try {
      const usersToInterest = testUsers.filter(() => this.randomBoolean(interestRatio / 100));

      if (usersToInterest.length === 0) {
        return { created: 0 };
      }

      const interests = usersToInterest.map(user => ({
        event_id: eventId,
        test_profile_id: user.id,
      }));

      // Use test_event_interests table instead of user_event_interests
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('test_event_interests')
        .insert(interests)
        .select('id');

      if (error) {
        throw new Error(error.message);
      }

      logger.info('Created mock interests', {
        count: data?.length ?? 0,
        eventId,
        source: 'MockOrderService.generateMockInterests',
      });

      return { created: data?.length ?? 0 };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to generate mock interests', {
        error: message,
        eventId,
        source: 'MockOrderService.generateMockInterests',
      });
      return { created: 0, error: `Interest generation failed: ${message}` };
    }
  }

  // Utility methods
  private generateFakeEmail(): string {
    const firstName = this.randomElement(FIRST_NAMES).toLowerCase();
    const lastName = this.randomElement(LAST_NAMES).toLowerCase();
    const domain = this.randomElement(EMAIL_DOMAINS);
    const number = this.randomInt(1, 999);
    return `${firstName}.${lastName}${number}@${domain}`;
  }

  private generateFakeName(): string {
    return `${this.randomElement(FIRST_NAMES)} ${this.randomElement(LAST_NAMES)}`;
  }

  private randomDateInRange(start: string, end: string): string {
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const randomTime = startDate + Math.random() * (endDate - startDate);
    return new Date(randomTime).toISOString();
  }

  private selectTierByWeight(selections: TierSelection[]): TierSelection {
    const totalWeight = selections.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const selection of selections) {
      random -= selection.weight;
      if (random <= 0) return selection;
    }

    return selections[0];
  }

  private selectStatus(distribution: OrderStatusDistribution): 'paid' | 'refunded' | 'cancelled' {
    const random = Math.random() * 100;
    if (random < distribution.paid) return 'paid';
    if (random < distribution.paid + distribution.refunded) return 'refunded';
    return 'cancelled';
  }

  /**
   * Fetch ticketing fees from database
   * Uses same logic as useTicketFees hook
   */
  private async fetchTicketingFees(): Promise<TicketingFee[]> {
    try {
      // Get current environment dynamically from service
      const currentEnv = await environmentService.getCurrentEnvironment();

      if (!currentEnv) {
        logger.warn('Could not determine environment, using empty fees', {
          source: 'MockOrderService.fetchTicketingFees',
        });
        return [];
      }

      // Fetch 'all' environment ID
      const { data: allEnvData, error: allEnvError } = await supabase
        .from('environments')
        .select('id')
        .eq('name', 'all')
        .single();

      if (allEnvError) {
        logger.error('Failed to fetch "all" environment:', {
          error: allEnvError.message,
          source: 'MockOrderService.fetchTicketingFees',
        });
      }

      const environmentIds = [currentEnv.id];
      if (allEnvData) {
        environmentIds.push(allEnvData.id);
      }

      // Fetch fees for current environment OR 'all' environment
      const { data, error } = await supabase
        .from('ticketing_fees')
        .select('*')
        .eq('is_active', true)
        .in('environment_id', environmentIds);

      if (error) {
        logger.error('Failed to fetch ticketing fees:', {
          error: error.message,
          source: 'MockOrderService.fetchTicketingFees',
        });
        return [];
      }

      logger.debug('Ticketing fees loaded for mock orders', {
        environment: currentEnv.name,
        feeCount: data?.length || 0,
        fees: data?.map(f => f.fee_name),
        source: 'MockOrderService.fetchTicketingFees',
      });

      return (data || []) as TicketingFee[];
    } catch (error) {
      logger.error('Error fetching ticketing fees', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'MockOrderService.fetchTicketingFees',
      });
      return [];
    }
  }

  /**
   * Calculate fees with proper ordering:
   * 1. Platform fee and processing fee applied to subtotal
   * 2. Sales tax applied to subtotal + platform_fee + processing_fee
   */
  private calculateFeesWithTax(subtotalCents: number, fees: TicketingFee[]): FeeCalculationResult {
    const result: FeeCalculationResult = {
      fees: [],
      total_fees_cents: 0,
      fee_breakdown: {},
    };

    // Separate sales_tax from other fees
    const salesTaxFee = fees.find(f => f.fee_name === 'sales_tax');
    const otherFees = fees.filter(f => f.fee_name !== 'sales_tax');

    // First calculate non-tax fees (platform_fee, processing_fee)
    let runningTotal = subtotalCents;

    for (const fee of otherFees) {
      let amountCents = 0;

      if (fee.fee_type === 'flat') {
        amountCents = Math.round(fee.fee_value * 100); // fee_value is in dollars for flat fees
      } else {
        // percentage - fee_value is the percentage (e.g., 2.9 for 2.9%)
        amountCents = Math.round((subtotalCents * fee.fee_value) / 100);
      }

      result.fees.push({
        name: fee.fee_name,
        type: fee.fee_type,
        value: fee.fee_value,
        amount_cents: amountCents,
      });

      result.fee_breakdown[`${fee.fee_name}_cents`] = amountCents;
      result.total_fees_cents += amountCents;
      runningTotal += amountCents;
    }

    // Now apply sales tax to the running total (subtotal + other fees)
    if (salesTaxFee) {
      let taxAmountCents = 0;

      if (salesTaxFee.fee_type === 'flat') {
        taxAmountCents = Math.round(salesTaxFee.fee_value * 100);
      } else {
        // Sales tax is percentage applied to subtotal + other fees
        taxAmountCents = Math.round((runningTotal * salesTaxFee.fee_value) / 100);
      }

      result.fees.push({
        name: 'sales_tax',
        type: salesTaxFee.fee_type,
        value: salesTaxFee.fee_value,
        amount_cents: taxAmountCents,
      });

      result.fee_breakdown['sales_tax_cents'] = taxAmountCents;
      result.total_fees_cents += taxAmountCents;
    }

    return result;
  }
}

// Export singleton instance
export const mockOrderService = new MockOrderService();
