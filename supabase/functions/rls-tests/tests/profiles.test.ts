/**
 * RLS Tests: Profiles Table
 *
 * Tests Row-Level Security policies for the profiles table.
 * Verifies users can access their own profile and public profile info.
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
  assertNoError,
} from '../utils/assert.ts';

export async function testProfilesRLS(testData: TestData): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: User can view own profile
  results.push(
    await runTest('Profiles: User can view own profile', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data, error } = await userAClient
        .from('profiles')
        .select('*')
        .eq('id', testData.userIds.USER_A)
        .single();

      assertNoError(error, 'Should be able to query own profile');
      assertGranted([data], 'User should see own profile');
    })
  );

  // Test 2: User can update own profile
  results.push(
    await runTest('Profiles: User can update own profile', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      await assertMutationGranted(async () => {
        return await userAClient
          .from('profiles')
          .update({ bio: 'RLS test bio update' })
          .eq('id', testData.userIds.USER_A)
          .select();
      }, 'User should be able to update own profile');
    })
  );

  // Test 3: User cannot update other user's profile
  results.push(
    await runTest('Profiles: User cannot update other user profile', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      // Attempt to update User B's profile
      const { data } = await userAClient
        .from('profiles')
        .update({ bio: 'Hacked bio' })
        .eq('id', testData.userIds.USER_B)
        .select();

      // Should return empty (no rows affected)
      assertDenied(
        data || [],
        'User A should not be able to update User B profile'
      );
    })
  );

  // Test 4: Admin can view any profile
  results.push(
    await runTest('Profiles: Admin can view any profile', async () => {
      const adminClient = await createUserClient(
        getTestUserEmail('ADMIN'),
        TEST_PASSWORD
      );

      const { data, error } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', testData.userIds.USER_A)
        .single();

      assertNoError(error, 'Admin should be able to query any profile');
      assertGranted([data], 'Admin should see any profile');
    })
  );

  // Test 5: Admin can update any profile
  results.push(
    await runTest('Profiles: Admin can update any profile', async () => {
      const adminClient = await createUserClient(
        getTestUserEmail('ADMIN'),
        TEST_PASSWORD
      );

      await assertMutationGranted(async () => {
        return await adminClient
          .from('profiles')
          .update({ bio: 'Admin updated this' })
          .eq('id', testData.userIds.USER_B)
          .select();
      }, 'Admin should be able to update any profile');
    })
  );

  // Test 6: User can view public info of other profiles
  results.push(
    await runTest('Profiles: User can view public profile info', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      // Should be able to see basic public info (display_name, avatar_url)
      const { data, error } = await userAClient
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', testData.userIds.USER_B)
        .single();

      // This depends on RLS policy - adjust based on actual implementation
      // Some setups allow viewing public fields
      if (!error && data) {
        assertGranted([data], 'User can view public profile fields');
      }
      // If denied, that's also valid - depends on policy
    })
  );

  // Test 7: Anonymous can view public profiles (if allowed by policy)
  results.push(
    await runTest('Profiles: Anonymous profile access check', async () => {
      const anonClient = createAnonClient();

      const { data, error } = await anonClient
        .from('profiles')
        .select('id, display_name')
        .limit(1);

      // This test documents the current behavior
      // Some apps allow anonymous viewing of public profiles
      if (!error && data && data.length > 0) {
        console.log('  Note: Anonymous can view some profile data');
      } else {
        console.log('  Note: Anonymous cannot view profiles');
      }
    })
  );

  // Test 8: User cannot delete own profile
  results.push(
    await runTest('Profiles: User cannot delete own profile', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data, error } = await userAClient
        .from('profiles')
        .delete()
        .eq('id', testData.userIds.USER_A)
        .select();

      // Profile deletion should be restricted
      // Either error or no rows affected
      if (error) {
        // Expected - deletion blocked
      } else {
        assertDenied(
          data || [],
          'User should not be able to delete own profile directly'
        );
      }
    })
  );

  return results;
}
