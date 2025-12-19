/**
 * Mock data generators for ticket flow testing
 */
/**
 * Generate random test event data
 * Note: venue_id and headliner_id must be provided or defaults will be used
 * The defaults may not exist in the database, so tests should create them first
 */
export const createMockEvent = (overrides) => {
    const id = `test-event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
        id,
        title: `Test Event ${id.substring(11, 18)}`,
        description: `Test event description for ${id}`,
        date: tomorrow.toISOString().split('T')[0],
        time: '20:00:00',
        venue_id: 'test-venue-default',
        headliner_id: 'test-artist-default',
        status: 'published',
        test_data: true,
        ...overrides,
    };
};
/**
 * Generate mock ticket tiers for an event
 */
export const createMockTicketTiers = (eventId, count = 3) => {
    const tiers = [];
    const tierNames = ['General Admission', 'VIP', 'Early Bird', 'Premium', 'Backstage'];
    for (let i = 0; i < count; i++) {
        tiers.push({
            id: `test-tier-${Date.now()}-${i}`,
            event_id: eventId,
            name: tierNames[i] || `Tier ${i + 1}`,
            description: `Test tier ${i + 1} description`,
            price: 50 + i * 25,
            total_tickets: 100,
            available_inventory: 100 - i * 10,
            tier_order: i + 1,
            is_active: true,
        });
    }
    return tiers;
};
/**
 * Generate random test user data
 */
export const createMockUser = (overrides) => {
    const firstNames = ['John', 'Jane', 'Alex', 'Sarah', 'Mike', 'Emily', 'David', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomId = Math.random().toString(36).substring(2, 9);
    return {
        id: `test-user-${Date.now()}-${randomId}`,
        firstName,
        lastName,
        email: `test.${firstName.toLowerCase()}.${lastName.toLowerCase()}.${randomId}@example.com`,
        phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        ...overrides,
    };
};
/**
 * Stripe test card numbers for different scenarios
 * See: https://stripe.com/docs/testing
 */
export const STRIPE_TEST_CARDS = {
    SUCCESS: '4242424242424242',
    DECLINE: '4000000000000002',
    INSUFFICIENT_FUNDS: '4000000000009995',
    EXPIRED: '4000000000000069',
    PROCESSING_ERROR: '4000000000000119',
    REQUIRE_3DS: '4000002500003155',
    REQUIRE_3DS_2: '4000002760003184',
};
/**
 * Sample billing address for testing
 */
export const MOCK_BILLING_ADDRESS = {
    street: '123 Test Street',
    city: 'Test City',
    state: 'TC',
    zip: '12345',
    country: 'US',
};
/**
 * Create mock order data
 */
export const createMockOrder = (userId, eventId, overrides) => {
    return {
        id: `test-order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        user_id: userId,
        event_id: eventId,
        total_amount: 100,
        status: 'completed',
        created_at: new Date().toISOString(),
        ...overrides,
    };
};
/**
 * Test data prefixes for easy cleanup
 */
export const TEST_PREFIXES = {
    EVENT: 'test-event-',
    USER: 'test-user-',
    TIER: 'test-tier-',
    ORDER: 'test-order-',
    SESSION: 'test-session-',
};
