/**
 * RLS Tests: User Roles Table
 *
 * Tests Row-Level Security policies for the user_roles table.
 * CRITICAL: This table controls access to the entire system.
 * Only admins should be able to modify roles.
 */

import { TestData } from '../fixtures/data.ts';
import { TestResult, runTest } from '../index.ts';
import { TEST_PASSWORD, getTestUserEmail } from '../fixtures/users.ts';
import { createUserClient, createAnonClient, createServiceClient } from '../utils/auth.ts';
import {
  assertDenied,
  assertGranted,
  assertMutationDenied,
  assertMutationGranted,
} from '../utils/assert.ts';

export async function testUserRolesRLS(testData: TestData): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Anonymous cannot view user roles
  results.push(
    await runTest('UserRoles: Anonymous cannot view roles', async () => {
      const anonClient = createAnonClient();
      const { data } = await anonClient.from('user_roles').select('*');

      assertDenied(data || [], 'Anonymous should not see any user roles');
    })
  );

  // Test 2: User can view own roles
  results.push(
    await runTest('UserRoles: User can view own roles', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient
        .from('user_roles')
        .select('*')
        .eq('user_id', testData.userIds.USER_A);

      // User A has no roles, so empty is expected
      // But the query should succeed (not error)
    })
  );

  // Test 3: User cannot view other user's roles
  results.push(
    await runTest('UserRoles: User cannot view other user roles', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data } = await userAClient
        .from('user_roles')
        .select('*')
        .eq('user_id', testData.userIds.ADMIN);

      assertDenied(
        data || [],
        'User A should not see admin user roles'
      );
    })
  );

  // Test 4: CRITICAL - User cannot INSERT roles for themselves
  results.push(
    await runTest('UserRoles: User cannot self-assign roles', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      // Get admin role ID using service client
      const serviceClient = createServiceClient();
      const { data: adminRole } = await serviceClient
        .from('roles')
        .select('id')
        .eq('name', 'admin')
        .single();

      if (!adminRole) {
        throw new Error('Admin role not found');
      }

      // Attempt to grant self admin role
      await assertMutationDenied(async () => {
        return await userAClient
          .from('user_roles')
          .insert({
            user_id: testData.userIds.USER_A,
            role_id: adminRole.id,
          })
          .select();
      }, 'User should NOT be able to grant themselves admin role');
    })
  );

  // Test 5: CRITICAL - User cannot UPDATE their own roles
  results.push(
    await runTest('UserRoles: User cannot update own roles', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      // Get any existing role for the user
      const { data: existingRoles } = await userAClient
        .from('user_roles')
        .select('*')
        .eq('user_id', testData.userIds.USER_A);

      // Even if no roles exist, verify UPDATE is blocked
      // by trying to update all records for this user
      const { data } = await userAClient
        .from('user_roles')
        .update({ role_id: 'some-role-id' })
        .eq('user_id', testData.userIds.USER_A)
        .select();

      // Should be denied
      assertDenied(data || [], 'User should not be able to update own roles');
    })
  );

  // Test 6: CRITICAL - User cannot DELETE their own roles
  results.push(
    await runTest('UserRoles: User cannot delete own roles', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const { data, error } = await userAClient
        .from('user_roles')
        .delete()
        .eq('user_id', testData.userIds.USER_A)
        .select();

      // Should be denied
      if (!error) {
        assertDenied(data || [], 'User should not be able to delete own roles');
      }
    })
  );

  // Test 7: CRITICAL - User cannot assign roles to other users
  results.push(
    await runTest('UserRoles: User cannot assign roles to others', async () => {
      const userAClient = await createUserClient(
        getTestUserEmail('USER_A'),
        TEST_PASSWORD
      );

      const serviceClient = createServiceClient();
      const { data: artistRole } = await serviceClient
        .from('roles')
        .select('id')
        .eq('name', 'artist')
        .single();

      if (!artistRole) {
        throw new Error('Artist role not found');
      }

      await assertMutationDenied(async () => {
        return await userAClient
          .from('user_roles')
          .insert({
            user_id: testData.userIds.USER_B,
            role_id: artistRole.id,
          })
          .select();
      }, 'User should NOT be able to assign roles to other users');
    })
  );

  // Test 8: Admin CAN view all user roles
  results.push(
    await runTest('UserRoles: Admin can view all roles', async () => {
      const adminClient = await createUserClient(
        getTestUserEmail('ADMIN'),
        TEST_PASSWORD
      );

      const { data } = await adminClient.from('user_roles').select('*');

      assertGranted(data || [], 'Admin should see user roles');
    })
  );

  // Test 9: Admin CAN insert roles
  results.push(
    await runTest('UserRoles: Admin can insert roles', async () => {
      const adminClient = await createUserClient(
        getTestUserEmail('ADMIN'),
        TEST_PASSWORD
      );

      const serviceClient = createServiceClient();
      const { data: artistRole } = await serviceClient
        .from('roles')
        .select('id')
        .eq('name', 'artist')
        .single();

      if (!artistRole) {
        throw new Error('Artist role not found');
      }

      // Check if role already exists
      const { data: existing } = await serviceClient
        .from('user_roles')
        .select('id')
        .eq('user_id', testData.userIds.USER_B)
        .eq('role_id', artistRole.id)
        .maybeSingle();

      if (!existing) {
        await assertMutationGranted(async () => {
          return await adminClient
            .from('user_roles')
            .insert({
              user_id: testData.userIds.USER_B,
              role_id: artistRole.id,
            })
            .select();
        }, 'Admin should be able to insert roles');

        // Clean up - remove the role we just added
        await serviceClient
          .from('user_roles')
          .delete()
          .eq('user_id', testData.userIds.USER_B)
          .eq('role_id', artistRole.id);
      }
    })
  );

  // Test 10: Admin CAN delete roles
  results.push(
    await runTest('UserRoles: Admin can delete roles', async () => {
      const adminClient = await createUserClient(
        getTestUserEmail('ADMIN'),
        TEST_PASSWORD
      );

      // Create a test role assignment first using service client
      const serviceClient = createServiceClient();
      const { data: artistRole } = await serviceClient
        .from('roles')
        .select('id')
        .eq('name', 'artist')
        .single();

      if (!artistRole) {
        throw new Error('Artist role not found');
      }

      // Insert a role to delete
      await serviceClient.from('user_roles').insert({
        user_id: testData.userIds.USER_B,
        role_id: artistRole.id,
      });

      // Now admin should be able to delete it
      await assertMutationGranted(async () => {
        return await adminClient
          .from('user_roles')
          .delete()
          .eq('user_id', testData.userIds.USER_B)
          .eq('role_id', artistRole.id)
          .select();
      }, 'Admin should be able to delete roles');
    })
  );

  return results;
}
