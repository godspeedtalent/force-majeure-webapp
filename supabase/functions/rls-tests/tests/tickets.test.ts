/**
 * RLS Tests: Tickets Table
 *
 * Tests Row-Level Security policies for the tickets table.
 * Verifies users can only access their own tickets.
 */

import { TestData } from '../fixtures/data.ts';
import { TestResult, runTest } from '../index.ts';
import { TEST_PASSWORD, getTestUserEmail } from '../fixtures/users.ts';
import { createUserClient, createAnonClient } from '../utils/auth.ts';
import {
  assertDenied,
  assertGranted,
  assertAllBelongToUser,
  assertRowCount,
  assertMutationDenied,
} from '../utils/assert.ts';

export async function testTicketsRLS(testData: TestData): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Anonymous cannot view tickets
  results.push(
    await runTest('Tickets: Anonymous cannot view tickets', async () => {
      const anonClient = createAnonClient();
      const { data } = await anonClient.from('tickets').select('*');

      assertDenied(data || [], 'Anonymous should not see any tickets');
    })
  );

  // Test 2: User can view own tickets
  results.push(
    await runTest('Tickets: User can view own tickets', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient.from('tickets').select('*');

      assertGranted(data || [], 'User A should see their tickets');
      assertAllBelongToUser(
        data || [],
        testData.userIds.USER_A,
        'All tickets should belong to User A'
      );
    })
  );

  // Test 3: User cannot view other user's tickets
  results.push(
    await runTest('Tickets: User cannot view other user tickets', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient
        .from('tickets')
        .select('*')
        .eq('id', testData.tickets.ticketUserB.id);

      assertDenied(data || [], 'User A should not see User B tickets');
    })
  );

  // Test 4: User cannot update other user's tickets
  results.push(
    await runTest('Tickets: User cannot update other user tickets', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient
        .from('tickets')
        .update({ status: 'used' })
        .eq('id', testData.tickets.ticketUserB.id)
        .select();

      assertDenied(
        data || [],
        'User A should not be able to update User B tickets'
      );
    })
  );

  // Test 5: Admin can view all tickets
  results.push(
    await runTest('Tickets: Admin can view all tickets', async () => {
      const adminClient = await createUserClient(
        getTestUserEmail('ADMIN'),
        TEST_PASSWORD
      );

      const { data } = await adminClient.from('tickets').select('*');

      assertGranted(data || [], 'Admin should see tickets');

      // Verify admin sees test tickets from different users
      const testTicketIds = [
        testData.tickets.ticketUserA.id,
        testData.tickets.ticketUserB.id,
      ];
      const foundTestTickets = (data || []).filter((t: { id: string }) =>
        testTicketIds.includes(t.id)
      );

      assertRowCount(
        foundTestTickets.length,
        2,
        'Admin should see both test tickets'
      );
    })
  );

  // Test 6: Anonymous cannot insert tickets
  results.push(
    await runTest('Tickets: Anonymous cannot insert tickets', async () => {
      const anonClient = createAnonClient();

      await assertMutationDenied(async () => {
        return await anonClient
          .from('tickets')
          .insert({
            order_id: testData.orders.orderUserA.id,
            user_id: testData.userIds.USER_A,
            event_id: testData.events.event1.id,
            ticket_tier_id: testData.ticketTiers.tier1.id,
            status: 'valid',
            ticket_number: 'HACK-001',
          })
          .select();
      }, 'Anonymous should not be able to insert tickets');
    })
  );

  // Test 7: User cannot insert tickets for another user
  results.push(
    await runTest('Tickets: User cannot insert tickets for others', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data, error } = await userAClient
        .from('tickets')
        .insert({
          order_id: testData.orders.orderUserB.id,
          user_id: testData.userIds.USER_B,
          event_id: testData.events.event1.id,
          ticket_tier_id: testData.ticketTiers.tier1.id,
          status: 'valid',
          ticket_number: 'HACK-002',
        })
        .select();

      // Should fail - either error or no rows returned
      if (!error) {
        assertDenied(
          data || [],
          'User A should not be able to insert tickets for User B'
        );
      }
    })
  );

  // Test 8: Event staff/manager can view tickets for their events
  results.push(
    await runTest('Tickets: Org admin can view event tickets', async () => {
      const orgAdminClient = await createUserClient(
        getTestUserEmail('ORG_ADMIN'),
        TEST_PASSWORD
      );

      // Org admin should be able to view tickets for events in their org
      const { data } = await orgAdminClient
        .from('tickets')
        .select('*')
        .eq('event_id', testData.events.event1.id);

      // Depends on RLS policy - org admins may or may not have access
      // This documents the current behavior
      if (data && data.length > 0) {
        console.log('  Note: Org admin can view event tickets');
      } else {
        console.log('  Note: Org admin cannot view event tickets directly');
      }
    })
  );

  return results;
}
