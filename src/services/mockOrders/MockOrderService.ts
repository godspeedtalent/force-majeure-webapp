/**
 * Mock Order Service
 *
 * Service for generating and managing mock order data for test events.
 * Extends TestDataService for access to randomization utilities.
 */

import { supabase } from '@/shared';
import { logger } from '@/shared/services/logger';
import { TestDataService } from '@/services/testData/TestDataService';
import type { TicketTier } from '@/features/events/types';
import type {
  MockOrderConfig,
  MockOrderGenerationResult,
  MockOrderDeletionResult,
  TierSelection,
  TestEventSummary,
  OrderStatusDistribution,
} from './types';
import { MOCK_ORDER_CONSTANTS } from './types';

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
}

/**
 * Internal type for order item insertion
 */
interface OrderItemInsert {
  order_id: string;
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
      errors: [],
      orderIds: [],
      executionTimeMs: 0,
    };

    try {
      // Validate event is in test status
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, status, title')
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

      // Get registered users if needed
      let registeredUsers: Array<{ id: string; email: string }> = [];
      const registeredOrderCount = Math.floor(config.totalOrders * (config.registeredUserRatio / 100));

      if (registeredOrderCount > 0) {
        const userIds = config.specificUserIds?.length
          ? config.specificUserIds
          : undefined;

        let query = supabase
          .from('profiles')
          .select('id, email')
          .limit(Math.min(registeredOrderCount * 2, 100)); // Get extra for randomization

        if (userIds) {
          query = query.in('id', userIds);
        }

        const { data: users } = await query;
        registeredUsers = (users || []).filter(u => u.email) as Array<{ id: string; email: string }>;
      }

      // Generate orders in batches
      const ordersToCreate = this.prepareOrderData(config, registeredUsers, tiers as TicketTier[]);

      for (let i = 0; i < ordersToCreate.length; i += MOCK_ORDER_CONSTANTS.BATCH_SIZE) {
        const batch = ordersToCreate.slice(i, i + MOCK_ORDER_CONSTANTS.BATCH_SIZE);
        const batchResult = await this.createOrderBatch(batch, config);

        result.ordersCreated += batchResult.ordersCreated;
        result.ticketsCreated += batchResult.ticketsCreated;
        result.guestsCreated += batchResult.guestsCreated;
        result.orderIds.push(...batchResult.orderIds);
        result.errors.push(...batchResult.errors);
      }

      result.success = result.errors.length === 0;
      result.executionTimeMs = Date.now() - startTime;

      logger.info('Mock order generation completed', {
        eventId: config.eventId,
        ordersCreated: result.ordersCreated,
        ticketsCreated: result.ticketsCreated,
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
      };

      logger.info('Mock orders deleted', {
        eventId,
        deleted_orders: deletionResult.deleted_orders,
        deleted_tickets: deletionResult.deleted_tickets,
        source: 'MockOrderService.deleteMockOrdersByEvent',
      });

      return {
        success: true,
        deletedOrders: deletionResult.deleted_orders ?? 0,
        deletedTickets: deletionResult.deleted_tickets ?? 0,
        deletedOrderItems: deletionResult.deleted_order_items ?? 0,
        deletedGuests: deletionResult.deleted_guests ?? 0,
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

    // Get mock order counts for each event
    const eventIds = events.map(e => e.id);

    if (eventIds.length === 0) {
      return [];
    }

    const { data: orderCounts } = await supabase
      .from('orders')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('test_data', true);

    const countMap = new Map<string, number>();
    (orderCounts || []).forEach(o => {
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

    // Get mock order count
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('test_data', true);

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
    registeredUsers: Array<{ id: string; email: string }>,
    tiers: TicketTier[]
  ): PreparedOrderData[] {
    const orders: PreparedOrderData[] = [];
    const registeredOrderCount = Math.floor(config.totalOrders * (config.registeredUserRatio / 100));

    // Create tier lookup
    const tierMap = new Map(tiers.map(t => [t.id, t]));

    for (let i = 0; i < config.totalOrders; i++) {
      const isRegisteredUser = i < registeredOrderCount && registeredUsers.length > 0;
      const user = isRegisteredUser
        ? this.randomElement(registeredUsers)
        : null;

      // Generate order date within range
      const orderDate = this.randomDateInRange(config.dateRangeStart, config.dateRangeEnd);

      // Select random tier based on weights
      const selectedTier = this.selectTierByWeight(config.tierSelections);
      const tier = tierMap.get(selectedTier.tierId);
      if (!tier) continue;

      // Random quantity within tier selection range
      const ticketQuantity = this.randomInt(selectedTier.minQuantity, selectedTier.maxQuantity);

      // Determine status based on distribution
      const status = this.selectStatus(config.statusDistribution);

      // Calculate protection
      const hasProtection = config.includeTicketProtection &&
        this.randomBoolean(config.ticketProtectionRatio / 100);

      // Calculate totals
      const ticketSubtotal = tier.price_cents * ticketQuantity;
      const protectionTotal = hasProtection ? MOCK_ORDER_CONSTANTS.TICKET_PROTECTION_PRICE_CENTS * ticketQuantity : 0;
      const subtotal = ticketSubtotal + protectionTotal;
      const fees = Math.round(subtotal * (MOCK_ORDER_CONSTANTS.DEFAULT_FEE_BPS / 10000));
      const total = subtotal + fees;

      orders.push({
        isRegisteredUser,
        userId: user?.id || null,
        userEmail: user?.email || this.generateFakeEmail(),
        guestName: isRegisteredUser ? null : this.generateFakeName(),
        orderDate,
        tierId: selectedTier.tierId,
        tierPrice: tier.price_cents,
        ticketQuantity,
        hasProtection,
        status,
        subtotalCents: subtotal,
        feesCents: fees,
        totalCents: total,
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

        // Create guest if needed
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

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            event_id: config.eventId,
            user_id: orderData.userId,
            guest_id: guestId,
            customer_email: orderData.userEmail,
            status: orderData.status,
            subtotal_cents: orderData.subtotalCents,
            fees_cents: orderData.feesCents,
            total_cents: orderData.totalCents,
            currency: 'usd',
            created_at: orderData.orderDate,
            test_data: true,
          })
          .select('id')
          .single();

        if (orderError) {
          result.errors.push(`Order creation failed: ${orderError.message}`);
          continue;
        }

        result.ordersCreated++;
        result.orderIds.push(order.id);

        // Create order items
        const orderItems: OrderItemInsert[] = [{
          order_id: order.id,
          item_type: 'ticket',
          ticket_tier_id: orderData.tierId,
          quantity: orderData.ticketQuantity,
          unit_price_cents: orderData.tierPrice,
          unit_fee_cents: Math.round(orderData.tierPrice * (MOCK_ORDER_CONSTANTS.DEFAULT_FEE_BPS / 10000)),
        }];

        if (orderData.hasProtection) {
          orderItems.push({
            order_id: order.id,
            item_type: 'product',
            product_id: MOCK_ORDER_CONSTANTS.TICKET_PROTECTION_PRODUCT_ID,
            quantity: orderData.ticketQuantity,
            unit_price_cents: MOCK_ORDER_CONSTANTS.TICKET_PROTECTION_PRICE_CENTS,
            unit_fee_cents: 0,
          });
        }

        const { data: createdItems, error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)
          .select('id');

        if (itemsError || !createdItems?.length) {
          result.errors.push(`Order items creation failed: ${itemsError?.message || 'Unknown'}`);
          continue;
        }

        // Create tickets - one per quantity
        const ticketOrderItem = createdItems[0];
        const ticketStatus = orderData.status === 'paid' ? 'valid' : orderData.status;

        const tickets = Array.from({ length: orderData.ticketQuantity }, (_, idx) => ({
          order_id: order.id,
          order_item_id: ticketOrderItem.id,
          ticket_tier_id: orderData.tierId,
          event_id: config.eventId,
          attendee_name: orderData.guestName || null,
          attendee_email: orderData.userEmail,
          qr_code_data: `MOCK-${order.id}-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          status: ticketStatus,
          has_protection: orderData.hasProtection,
          test_data: true,
        }));

        const { data: createdTickets, error: ticketsError } = await supabase
          .from('tickets')
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
}

// Export singleton instance
export const mockOrderService = new MockOrderService();
