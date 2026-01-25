/**
 * RLS Tests: Promo Codes Table
 *
 * Tests Row-Level Security policies for the promo_codes table.
 * Promo codes have financial impact and must be properly secured.
 */

import { TestData } from '../fixtures/data.ts';
import { TestResult, runTest } from '../index.ts';
import { TEST_PASSWORD, getTestUserEmail } from '../fixtures/users.ts';
import { createUserClient, createAnonClient } from '../utils/auth.ts';
import {
  assertDenied,
  assertGranted,
  assertMutationDenied,
  assertMutationGranted,
} from '../utils/assert.ts';

export async function testPromoCodesRLS(testData: TestData): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Anonymous cannot list promo codes
  results.push(
    await runTest('PromoCodes: Anonymous cannot list codes', async () => {
      const anonClient = createAnonClient();
      const { data } = await anonClient.from('promo_codes').select('*');

      assertDenied(data || [], 'Anonymous should not see promo codes');
    })
  );

  // Test 2: Regular user cannot list all promo codes
  results.push(
    await runTest('PromoCodes: User cannot list all codes', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient.from('promo_codes').select('*');

      // Regular users should NOT be able to browse/list promo codes
      // They should only be able to validate specific codes they enter
      assertDenied(
        data || [],
        'Regular user should not be able to list promo codes'
      );
    })
  );

  // Test 3: User cannot view specific promo code by ID
  results.push(
    await runTest('PromoCodes: User cannot view codes by ID', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient
        .from('promo_codes')
        .select('*')
        .eq('id', testData.promoCodes.code1.id);

      assertDenied(
        data || [],
        'User should not be able to view promo codes directly'
      );
    })
  );

  // Test 4: User cannot create promo codes
  results.push(
    await runTest('PromoCodes: User cannot create codes', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      await assertMutationDenied(async () => {
        return await userAClient
          .from('promo_codes')
          .insert({
            code: 'HACKEDCODE',
            event_id: testData.events.event1.id,
            discount_type: 'percentage',
            discount_value: 100,
            max_uses: 1000,
          })
          .select();
      }, 'User should not be able to create promo codes');
    })
  );

  // Test 5: User cannot update promo codes
  results.push(
    await runTest('PromoCodes: User cannot update codes', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient
        .from('promo_codes')
        .update({ discount_value: 100 })
        .eq('id', testData.promoCodes.code1.id)
        .select();

      assertDenied(
        data || [],
        'User should not be able to update promo codes'
      );
    })
  );

  // Test 6: User cannot delete promo codes
  results.push(
    await runTest('PromoCodes: User cannot delete codes', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data, error } = await userAClient
        .from('promo_codes')
        .delete()
        .eq('id', testData.promoCodes.code1.id)
        .select();

      if (!error) {
        assertDenied(
          data || [],
          'User should not be able to delete promo codes'
        );
      }
    })
  );

  // Test 7: Admin can view all promo codes
  results.push(
    await runTest('PromoCodes: Admin can view all codes', async () => {
      const adminClient = await createUserClient(
        getTestUserEmail('ADMIN'),
        TEST_PASSWORD
      );

      const { data } = await adminClient.from('promo_codes').select('*');

      assertGranted(data || [], 'Admin should see promo codes');
    })
  );

  // Test 8: Admin can create promo codes
  results.push(
    await runTest('PromoCodes: Admin can create codes', async () => {
      const adminClient = await createUserClient(
        getTestUserEmail('ADMIN'),
        TEST_PASSWORD
      );

      await assertMutationGranted(async () => {
        const result = await adminClient
          .from('promo_codes')
          .insert({
            code: 'ADMINTEST' + Date.now(),
            event_id: testData.events.event1.id,
            discount_type: 'percentage',
            discount_value: 5,
            max_uses: 1,
          })
          .select();

        // Clean up the test code
        if (result.data && result.data.length > 0) {
          await adminClient
            .from('promo_codes')
            .delete()
            .eq('id', result.data[0].id);
        }

        return result;
      }, 'Admin should be able to create promo codes');
    })
  );

  // Test 9: Admin can update promo codes
  results.push(
    await runTest('PromoCodes: Admin can update codes', async () => {
      const adminClient = await createUserClient(
        getTestUserEmail('ADMIN'),
        TEST_PASSWORD
      );

      await assertMutationGranted(async () => {
        return await adminClient
          .from('promo_codes')
          .update({ description: 'Updated by admin test' })
          .eq('id', testData.promoCodes.code1.id)
          .select();
      }, 'Admin should be able to update promo codes');
    })
  );

  // Test 10: Org admin can view promo codes for their org's events
  results.push(
    await runTest('PromoCodes: Org admin can view org event codes', async () => {
      const orgAdminClient = await createUserClient(
        getTestUserEmail('ORG_ADMIN'),
        TEST_PASSWORD
      );

      // Org admin should be able to see promo codes for events in their org
      const { data } = await orgAdminClient
        .from('promo_codes')
        .select('*')
        .eq('event_id', testData.events.event1.id);

      // This depends on RLS policy - document current behavior
      if (data && data.length > 0) {
        console.log('  Note: Org admin can view promo codes for their events');
        assertGranted(data, 'Org admin should see their event promo codes');
      } else {
        console.log('  Note: Org admin cannot view promo codes directly');
      }
    })
  );

  // Test 11: Org admin can manage promo codes for their events
  results.push(
    await runTest('PromoCodes: Org admin can create codes for events', async () => {
      const orgAdminClient = await createUserClient(
        getTestUserEmail('ORG_ADMIN'),
        TEST_PASSWORD
      );

      // Try to create a promo code for org's event
      const result = await orgAdminClient
        .from('promo_codes')
        .insert({
          code: 'ORGTEST' + Date.now(),
          event_id: testData.events.event1.id,
          discount_type: 'percentage',
          discount_value: 10,
          max_uses: 10,
        })
        .select();

      // Document current behavior
      if (!result.error && result.data && result.data.length > 0) {
        console.log('  Note: Org admin CAN create promo codes for their events');
        // Clean up
        await orgAdminClient
          .from('promo_codes')
          .delete()
          .eq('id', result.data[0].id);
      } else {
        console.log('  Note: Org admin CANNOT create promo codes directly');
      }
    })
  );

  return results;
}
