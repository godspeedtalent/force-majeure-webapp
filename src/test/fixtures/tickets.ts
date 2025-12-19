/**
 * Mock ticket tier data for testing
 */
export function createMockTicketTier(overrides?: any) {
  return {
    id: 'test-tier-id',
    event_id: 'test-event-id',
    name: 'General Admission',
    description: 'Standard entry ticket',
    price: 50.0,
    quantity_available: 100,
    quantity_sold: 25,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Mock order data for testing
 */
export function createMockOrder(overrides?: any) {
  return {
    id: 'test-order-id',
    user_id: 'test-user-id',
    total: 100.0,
    status: 'completed',
    stripe_payment_intent_id: 'pi_test_123',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Mock order item data for testing
 */
export function createMockOrderItem(overrides?: any) {
  return {
    id: 'test-order-item-id',
    order_id: 'test-order-id',
    ticket_tier_id: 'test-tier-id',
    quantity: 2,
    price_per_ticket: 50.0,
    subtotal: 100.0,
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}
