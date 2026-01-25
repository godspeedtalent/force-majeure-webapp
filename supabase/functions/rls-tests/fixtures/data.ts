/**
 * RLS Test Data Fixtures
 *
 * Creates test data for RLS testing.
 * All data is associated with test users and cleaned up after tests.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { TestUserIds } from './users.ts';

export interface TestOrganization {
  id: string;
  name: string;
  owner_id: string;
}

export interface TestEvent {
  id: string;
  title: string;
  organization_id: string;
}

export interface TestTicketTier {
  id: string;
  event_id: string;
  name: string;
  price: number;
}

export interface TestOrder {
  id: string;
  user_id: string;
  event_id: string;
  total: number;
}

export interface TestOrderItem {
  id: string;
  order_id: string;
  ticket_tier_id: string;
}

export interface TestTicket {
  id: string;
  order_id: string;
  user_id: string;
}

export interface TestPromoCode {
  id: string;
  code: string;
  event_id: string;
  discount_percent: number;
}

export interface TestData {
  userIds: TestUserIds;
  organizations: {
    org1: TestOrganization;
    org2: TestOrganization;
  };
  events: {
    event1: TestEvent;
    event2: TestEvent;
  };
  ticketTiers: {
    tier1: TestTicketTier;
    tier2: TestTicketTier;
  };
  orders: {
    orderUserA: TestOrder;
    orderUserB: TestOrder;
  };
  orderItems: {
    itemUserA: TestOrderItem;
    itemUserB: TestOrderItem;
  };
  tickets: {
    ticketUserA: TestTicket;
    ticketUserB: TestTicket;
  };
  promoCodes: {
    code1: TestPromoCode;
    code2: TestPromoCode;
  };
}

/**
 * Create all test data
 */
export async function setupTestData(
  serviceClient: SupabaseClient,
  userIds: TestUserIds
): Promise<TestData> {
  console.log('Setting up test data...');

  // 1. Create organizations
  const { data: org1 } = await serviceClient
    .from('organizations')
    .insert({
      name: 'RLS Test Organization 1',
      owner_id: userIds.ORG_ADMIN,
      slug: 'rls-test-org-1-' + Date.now(),
    })
    .select()
    .single();

  const { data: org2 } = await serviceClient
    .from('organizations')
    .insert({
      name: 'RLS Test Organization 2',
      owner_id: userIds.USER_A,
      slug: 'rls-test-org-2-' + Date.now(),
    })
    .select()
    .single();

  console.log('  ✓ Created test organizations');

  // 2. Create venues (required for events)
  const { data: venue } = await serviceClient
    .from('venues')
    .insert({
      name: 'RLS Test Venue',
      city: 'Test City',
      state: 'TS',
      country: 'US',
    })
    .select()
    .single();

  // 3. Create events
  const eventDate = new Date();
  eventDate.setMonth(eventDate.getMonth() + 1);

  const { data: event1 } = await serviceClient
    .from('events')
    .insert({
      title: 'RLS Test Event 1',
      organization_id: org1!.id,
      venue_id: venue!.id,
      event_date: eventDate.toISOString(),
      status: 'published',
    })
    .select()
    .single();

  const { data: event2 } = await serviceClient
    .from('events')
    .insert({
      title: 'RLS Test Event 2',
      organization_id: org2!.id,
      venue_id: venue!.id,
      event_date: eventDate.toISOString(),
      status: 'published',
    })
    .select()
    .single();

  console.log('  ✓ Created test events');

  // 4. Create ticket tiers
  const { data: tier1 } = await serviceClient
    .from('ticket_tiers')
    .insert({
      event_id: event1!.id,
      name: 'General Admission',
      price: 25.0,
      total_inventory: 100,
      available_inventory: 100,
    })
    .select()
    .single();

  const { data: tier2 } = await serviceClient
    .from('ticket_tiers')
    .insert({
      event_id: event2!.id,
      name: 'VIP',
      price: 50.0,
      total_inventory: 50,
      available_inventory: 50,
    })
    .select()
    .single();

  console.log('  ✓ Created test ticket tiers');

  // 5. Create orders
  const { data: orderUserA } = await serviceClient
    .from('orders')
    .insert({
      user_id: userIds.USER_A,
      event_id: event1!.id,
      status: 'completed',
      subtotal: 25.0,
      total: 27.5,
      service_fee: 2.5,
    })
    .select()
    .single();

  const { data: orderUserB } = await serviceClient
    .from('orders')
    .insert({
      user_id: userIds.USER_B,
      event_id: event1!.id,
      status: 'completed',
      subtotal: 50.0,
      total: 55.0,
      service_fee: 5.0,
    })
    .select()
    .single();

  console.log('  ✓ Created test orders');

  // 6. Create order items
  const { data: itemUserA } = await serviceClient
    .from('order_items')
    .insert({
      order_id: orderUserA!.id,
      ticket_tier_id: tier1!.id,
      quantity: 1,
      unit_price: 25.0,
      total_price: 25.0,
    })
    .select()
    .single();

  const { data: itemUserB } = await serviceClient
    .from('order_items')
    .insert({
      order_id: orderUserB!.id,
      ticket_tier_id: tier1!.id,
      quantity: 2,
      unit_price: 25.0,
      total_price: 50.0,
    })
    .select()
    .single();

  console.log('  ✓ Created test order items');

  // 7. Create tickets
  const { data: ticketUserA } = await serviceClient
    .from('tickets')
    .insert({
      order_id: orderUserA!.id,
      user_id: userIds.USER_A,
      event_id: event1!.id,
      ticket_tier_id: tier1!.id,
      status: 'valid',
      ticket_number: 'RLS-TEST-001',
    })
    .select()
    .single();

  const { data: ticketUserB } = await serviceClient
    .from('tickets')
    .insert({
      order_id: orderUserB!.id,
      user_id: userIds.USER_B,
      event_id: event1!.id,
      ticket_tier_id: tier1!.id,
      status: 'valid',
      ticket_number: 'RLS-TEST-002',
    })
    .select()
    .single();

  console.log('  ✓ Created test tickets');

  // 8. Create promo codes
  const { data: code1 } = await serviceClient
    .from('promo_codes')
    .insert({
      code: 'RLSTEST10',
      event_id: event1!.id,
      discount_type: 'percentage',
      discount_value: 10,
      max_uses: 100,
      uses_count: 0,
    })
    .select()
    .single();

  const { data: code2 } = await serviceClient
    .from('promo_codes')
    .insert({
      code: 'RLSTEST20',
      event_id: event2!.id,
      discount_type: 'percentage',
      discount_value: 20,
      max_uses: 50,
      uses_count: 0,
    })
    .select()
    .single();

  console.log('  ✓ Created test promo codes');

  return {
    userIds,
    organizations: {
      org1: org1 as TestOrganization,
      org2: org2 as TestOrganization,
    },
    events: {
      event1: event1 as TestEvent,
      event2: event2 as TestEvent,
    },
    ticketTiers: {
      tier1: tier1 as TestTicketTier,
      tier2: tier2 as TestTicketTier,
    },
    orders: {
      orderUserA: orderUserA as TestOrder,
      orderUserB: orderUserB as TestOrder,
    },
    orderItems: {
      itemUserA: itemUserA as TestOrderItem,
      itemUserB: itemUserB as TestOrderItem,
    },
    tickets: {
      ticketUserA: ticketUserA as TestTicket,
      ticketUserB: ticketUserB as TestTicket,
    },
    promoCodes: {
      code1: code1 as TestPromoCode,
      code2: code2 as TestPromoCode,
    },
  };
}

/**
 * Clean up all test data
 */
export async function cleanupTestData(
  serviceClient: SupabaseClient,
  testData: TestData
): Promise<void> {
  console.log('Cleaning up test data...');

  try {
    // Delete in reverse order of creation (respecting foreign keys)

    // Promo codes
    await serviceClient
      .from('promo_codes')
      .delete()
      .in('id', [testData.promoCodes.code1.id, testData.promoCodes.code2.id]);

    // Tickets
    await serviceClient
      .from('tickets')
      .delete()
      .in('id', [testData.tickets.ticketUserA.id, testData.tickets.ticketUserB.id]);

    // Order items
    await serviceClient
      .from('order_items')
      .delete()
      .in('id', [testData.orderItems.itemUserA.id, testData.orderItems.itemUserB.id]);

    // Orders
    await serviceClient
      .from('orders')
      .delete()
      .in('id', [testData.orders.orderUserA.id, testData.orders.orderUserB.id]);

    // Ticket tiers
    await serviceClient
      .from('ticket_tiers')
      .delete()
      .in('id', [testData.ticketTiers.tier1.id, testData.ticketTiers.tier2.id]);

    // Events
    await serviceClient
      .from('events')
      .delete()
      .in('id', [testData.events.event1.id, testData.events.event2.id]);

    // Organizations
    await serviceClient
      .from('organizations')
      .delete()
      .in('id', [testData.organizations.org1.id, testData.organizations.org2.id]);

    // Venues (delete by name pattern)
    await serviceClient
      .from('venues')
      .delete()
      .eq('name', 'RLS Test Venue');

    console.log('  ✓ Test data cleaned up');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}
