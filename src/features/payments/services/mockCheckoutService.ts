/**
 * Mock Checkout Service
 *
 * Creates real orders and tickets in the database for mock payment mode.
 * This allows testing the full checkout flow including email delivery
 * without processing real payments.
 */

import { supabase, logger } from '@/shared';

interface TicketSelection {
  tierId: string;
  tierName: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
}

interface MockCheckoutData {
  eventId: string;
  userId: string | null;
  customerEmail: string;
  customerName: string;
  tickets: TicketSelection[];
  subtotalCents: number;
  feesCents: number;
  totalCents: number;
  feeBreakdown?: Record<string, number>;
}

interface MockCheckoutResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

const mockCheckoutLogger = logger.createNamespace('MockCheckoutService');

export const mockCheckoutService = {
  /**
   * Create a complete mock order with tickets
   *
   * Creates:
   * 1. Order record in orders table
   * 2. Order items for each ticket tier
   * 3. Individual tickets with QR codes
   *
   * @param data - Checkout data including event, user, and ticket selections
   * @returns Result with order ID on success
   */
  async createMockOrder(data: MockCheckoutData): Promise<MockCheckoutResult> {
    const startTime = Date.now();

    try {
      mockCheckoutLogger.info('Creating mock order', {
        eventId: data.eventId,
        ticketCount: data.tickets.reduce((sum, t) => sum + t.quantity, 0),
        totalCents: data.totalCents,
      });

      // Generate a mock session ID for tracking
      const mockSessionId = `mock_cs_${crypto.randomUUID()}`;

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          event_id: data.eventId,
          user_id: data.userId,
          customer_email: data.customerEmail,
          status: 'paid',
          subtotal_cents: data.subtotalCents,
          fees_cents: data.feesCents,
          total_cents: data.totalCents,
          fee_breakdown: data.feeBreakdown || {},
          currency: 'usd',
          stripe_checkout_session_id: mockSessionId,
          test_data: true, // Mark as test/mock order
        })
        .select('id')
        .single();

      if (orderError) {
        mockCheckoutLogger.error('Failed to create order', {
          error: orderError.message,
          eventId: data.eventId,
        });
        return { success: false, error: `Order creation failed: ${orderError.message}` };
      }

      const orderId = order.id;
      mockCheckoutLogger.info('Order created', { orderId });

      // Create order items
      // Note: subtotal_cents, fees_cents, and total_cents are GENERATED columns
      // that are automatically computed from quantity, unit_price_cents, and unit_fee_cents
      const orderItems = data.tickets.map(ticket => ({
        order_id: orderId,
        ticket_tier_id: ticket.tierId,
        quantity: ticket.quantity,
        unit_price_cents: ticket.unitPriceCents,
        unit_fee_cents: 0, // Fees tracked at order level
      }));

      const { data: createdItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select('id, ticket_tier_id, quantity');

      if (itemsError) {
        mockCheckoutLogger.error('Failed to create order items', {
          error: itemsError.message,
          orderId,
        });
        // Cleanup: delete the order
        await supabase.from('orders').delete().eq('id', orderId);
        return { success: false, error: `Order items creation failed: ${itemsError.message}` };
      }

      // Create individual tickets
      const tickets: Array<{
        order_id: string;
        order_item_id: string;
        ticket_tier_id: string;
        event_id: string;
        attendee_name: string | null;
        attendee_email: string;
        qr_code_data: string;
        status: string;
      }> = [];

      for (const item of createdItems || []) {
        const tierId = item.ticket_tier_id;
        if (!tierId) continue; // Skip if tier ID is missing

        for (let i = 0; i < item.quantity; i++) {
          tickets.push({
            order_id: orderId,
            order_item_id: item.id,
            ticket_tier_id: tierId,
            event_id: data.eventId,
            attendee_name: data.customerName || null,
            attendee_email: data.customerEmail,
            qr_code_data: `MOCK-${orderId.slice(0, 8)}-${item.id.slice(0, 4)}-${i}-${Date.now().toString(36)}`,
            status: 'valid',
          });
        }
      }

      if (tickets.length > 0) {
        const { error: ticketsError } = await supabase.from('tickets').insert(tickets);

        if (ticketsError) {
          mockCheckoutLogger.error('Failed to create tickets', {
            error: ticketsError.message,
            orderId,
          });
          // Note: We don't rollback here since order is created. Tickets can be recreated.
          return { success: false, error: `Ticket creation failed: ${ticketsError.message}` };
        }
      }

      const duration = Date.now() - startTime;
      mockCheckoutLogger.info('Mock order completed', {
        orderId,
        ticketCount: tickets.length,
        durationMs: duration,
      });

      return { success: true, orderId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      mockCheckoutLogger.error('Unexpected error in mock checkout', { error: message });
      return { success: false, error: message };
    }
  },
};
