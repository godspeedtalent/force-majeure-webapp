/**
 * RLS Tests: Orders Table
 *
 * Tests Row-Level Security policies for the orders table.
 * Verifies users can only access their own orders, and admins can access all.
 */

import { TestData } from '../fixtures/data.ts';
import { TestResult, runTest } from '../index.ts';
import { TEST_PASSWORD, getTestUserEmail } from '../fixtures/users.ts';
import { createUserClient, createAnonClient } from '../utils/auth.ts';
import {
  assertDenied,
  assertGranted,
  assertRowCount,
  assertAllBelongToUser,
  assertMutationDenied,
  assertMutationGranted,
} from '../utils/assert.ts';

export async function testOrdersRLS(testData: TestData): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Anonymous users cannot view any orders
  results.push(
    await runTest('Orders: Anonymous cannot view orders', async () => {
      const anonClient = createAnonClient();
      const { data, error } = await anonClient.from('orders').select('*');

      // Should either error or return empty
      assertDenied(data || [], 'Anonymous should not see any orders');
    })
  );

  // Test 2: User A can view their own orders
  results.push(
    await runTest('Orders: User can view own orders', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient.from('orders').select('*');

      assertGranted(data || [], 'User A should see their orders');
      assertAllBelongToUser(
        data || [],
        testData.userIds.USER_A,
        'All orders should belong to User A'
      );
    })
  );

  // Test 3: User A cannot view User B's specific order
  results.push(
    await runTest('Orders: User cannot view other user orders', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient
        .from('orders')
        .select('*')
        .eq('id', testData.orders.orderUserB.id);

      assertDenied(data || [], 'User A should not see User B orders');
    })
  );

  // Test 4: User A cannot update User B's order
  results.push(
    await runTest('Orders: User cannot update other user orders', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      // Attempt to update User B's order
      const { data } = await userAClient
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', testData.orders.orderUserB.id)
        .select();

      // Should return empty (no rows affected)
      assertDenied(
        data || [],
        'User A should not be able to update User B orders'
      );
    })
  );

  // Test 5: Admin can view all orders
  results.push(
    await runTest('Orders: Admin can view all orders', async () => {
      const adminClient = await createUserClient(
        getTestUserEmail('ADMIN'),
        TEST_PASSWORD
      );

      const { data } = await adminClient.from('orders').select('*');

      assertGranted(data || [], 'Admin should see orders');

      // Should see at least the two test orders
      const testOrderIds = [
        testData.orders.orderUserA.id,
        testData.orders.orderUserB.id,
      ];
      const foundTestOrders = (data || []).filter((o: { id: string }) =>
        testOrderIds.includes(o.id)
      );

      assertRowCount(
        foundTestOrders.length,
        2,
        'Admin should see both test orders'
      );
    })
  );

  // Test 6: Admin can update any order
  results.push(
    await runTest('Orders: Admin can update any order', async () => {
      const adminClient = await createUserClient(
        getTestUserEmail('ADMIN'),
        TEST_PASSWORD
      );

      await assertMutationGranted(async () => {
        return await adminClient
          .from('orders')
          .update({ notes: 'Updated by admin test' })
          .eq('id', testData.orders.orderUserA.id)
          .select();
      }, 'Admin should be able to update any order');
    })
  );

  // Test 7: Developer can view all orders
  results.push(
    await runTest('Orders: Developer can view all orders', async () => {
      const devClient = await createUserClient(
        getTestUserEmail('DEVELOPER'),
        TEST_PASSWORD
      );

      const { data } = await devClient.from('orders').select('*');

      assertGranted(data || [], 'Developer should see orders');
    })
  );

  // Test 8: Anonymous cannot insert orders
  results.push(
    await runTest('Orders: Anonymous cannot insert orders', async () => {
      const anonClient = createAnonClient();

      await assertMutationDenied(async () => {
        return await anonClient
          .from('orders')
          .insert({
            user_id: testData.userIds.USER_A,
            event_id: testData.events.event1.id,
            status: 'pending',
            total: 100,
          })
          .select();
      }, 'Anonymous should not be able to insert orders');
    })
  );

  return results;
}
