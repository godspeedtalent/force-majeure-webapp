/**
 * RLS Tests: Order Items Table
 *
 * Tests Row-Level Security policies for the order_items table.
 * Order items should follow the same access rules as their parent orders.
 */

import { TestData } from '../fixtures/data.ts';
import { TestResult, runTest } from '../index.ts';
import { TEST_PASSWORD, getTestUserEmail } from '../fixtures/users.ts';
import { createUserClient, createAnonClient } from '../utils/auth.ts';
import {
  assertDenied,
  assertGranted,
  assertRowCount,
  assertMutationDenied,
} from '../utils/assert.ts';

export async function testOrderItemsRLS(testData: TestData): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Anonymous cannot view order items
  results.push(
    await runTest('OrderItems: Anonymous cannot view items', async () => {
      const anonClient = createAnonClient();
      const { data } = await anonClient.from('order_items').select('*');

      assertDenied(data || [], 'Anonymous should not see any order items');
    })
  );

  // Test 2: User can view items for own orders
  results.push(
    await runTest('OrderItems: User can view own order items', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient
        .from('order_items')
        .select('*')
        .eq('order_id', testData.orders.orderUserA.id);

      assertGranted(data || [], 'User A should see their order items');
    })
  );

  // Test 3: User cannot view items for other user's orders
  results.push(
    await runTest('OrderItems: User cannot view other user items', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient
        .from('order_items')
        .select('*')
        .eq('order_id', testData.orders.orderUserB.id);

      assertDenied(data || [], 'User A should not see User B order items');
    })
  );

  // Test 4: User cannot view specific order item by ID if not their order
  results.push(
    await runTest('OrderItems: User cannot view other items by ID', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient
        .from('order_items')
        .select('*')
        .eq('id', testData.orderItems.itemUserB.id);

      assertDenied(
        data || [],
        'User A should not see User B order item by ID'
      );
    })
  );

  // Test 5: User cannot insert items into other user's orders
  results.push(
    await runTest('OrderItems: User cannot insert into other orders', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      await assertMutationDenied(async () => {
        return await userAClient
          .from('order_items')
          .insert({
            order_id: testData.orders.orderUserB.id,
            ticket_tier_id: testData.ticketTiers.tier1.id,
            quantity: 10,
            unit_price: 0,
            total_price: 0,
          })
          .select();
      }, 'User A should not be able to add items to User B orders');
    })
  );

  // Test 6: User cannot update items in other user's orders
  results.push(
    await runTest('OrderItems: User cannot update other user items', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient
        .from('order_items')
        .update({ quantity: 100 })
        .eq('id', testData.orderItems.itemUserB.id)
        .select();

      assertDenied(
        data || [],
        'User A should not be able to update User B order items'
      );
    })
  );

  // Test 7: User cannot delete items from other user's orders
  results.push(
    await runTest('OrderItems: User cannot delete other user items', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data, error } = await userAClient
        .from('order_items')
        .delete()
        .eq('id', testData.orderItems.itemUserB.id)
        .select();

      if (!error) {
        assertDenied(
          data || [],
          'User A should not be able to delete User B order items'
        );
      }
    })
  );

  // Test 8: Admin can view all order items
  results.push(
    await runTest('OrderItems: Admin can view all items', async () => {
      const adminClient = await createUserClient(
        getTestUserEmail('ADMIN'),
        TEST_PASSWORD
      );

      const { data } = await adminClient.from('order_items').select('*');

      assertGranted(data || [], 'Admin should see order items');

      // Verify admin sees test items from different users
      const testItemIds = [
        testData.orderItems.itemUserA.id,
        testData.orderItems.itemUserB.id,
      ];
      const foundTestItems = (data || []).filter((i: { id: string }) =>
        testItemIds.includes(i.id)
      );

      assertRowCount(
        foundTestItems.length,
        2,
        'Admin should see both test order items'
      );
    })
  );

  // Test 9: User can view items with order join (should respect RLS)
  results.push(
    await runTest('OrderItems: User can join with own orders', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient
        .from('order_items')
        .select(`
          *,
          orders!inner (
            id,
            user_id,
            total
          )
        `);

      // Should only see items where the joined order belongs to user
      if (data && data.length > 0) {
        const wrongOwner = data.find(
          (item: { orders?: { user_id: string } }) =>
            item.orders?.user_id !== testData.userIds.USER_A
        );
        if (wrongOwner) {
          throw new Error('User saw order items from other users via join');
        }
      }
    })
  );

  // Test 10: Anonymous cannot insert order items
  results.push(
    await runTest('OrderItems: Anonymous cannot insert items', async () => {
      const anonClient = createAnonClient();

      await assertMutationDenied(async () => {
        return await anonClient
          .from('order_items')
          .insert({
            order_id: testData.orders.orderUserA.id,
            ticket_tier_id: testData.ticketTiers.tier1.id,
            quantity: 1,
            unit_price: 25,
            total_price: 25,
          })
          .select();
      }, 'Anonymous should not be able to insert order items');
    })
  );

  return results;
}
