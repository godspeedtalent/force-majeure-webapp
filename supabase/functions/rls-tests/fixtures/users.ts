/**
 * RLS Test User Fixtures
 *
 * Defines test users with different roles for comprehensive RLS testing.
 * Uses a specific naming convention to identify test users for cleanup.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Test user password (same for all test users)
export const TEST_PASSWORD = 'RLSTest2026!@#';

// Test email domain to identify test users
const TEST_EMAIL_DOMAIN = 'rls-test.forcemajeure.local';

export interface TestUserConfig {
  key: string;
  email: string;
  displayName: string;
  roles: string[];
}

export interface TestUserIds {
  ADMIN: string;
  USER_A: string;
  USER_B: string;
  ORG_ADMIN: string;
  ORG_STAFF: string;
  ARTIST: string;
  DEVELOPER: string;
}

/**
 * Test user configurations
 */
export const TEST_USERS: TestUserConfig[] = [
  {
    key: 'ADMIN',
    email: `admin@${TEST_EMAIL_DOMAIN}`,
    displayName: 'RLS Test Admin',
    roles: ['admin'],
  },
  {
    key: 'USER_A',
    email: `user-a@${TEST_EMAIL_DOMAIN}`,
    displayName: 'RLS Test User A',
    roles: [],
  },
  {
    key: 'USER_B',
    email: `user-b@${TEST_EMAIL_DOMAIN}`,
    displayName: 'RLS Test User B',
    roles: [],
  },
  {
    key: 'ORG_ADMIN',
    email: `org-admin@${TEST_EMAIL_DOMAIN}`,
    displayName: 'RLS Test Org Admin',
    roles: ['org_admin'],
  },
  {
    key: 'ORG_STAFF',
    email: `org-staff@${TEST_EMAIL_DOMAIN}`,
    displayName: 'RLS Test Org Staff',
    roles: ['org_staff'],
  },
  {
    key: 'ARTIST',
    email: `artist@${TEST_EMAIL_DOMAIN}`,
    displayName: 'RLS Test Artist',
    roles: ['artist'],
  },
  {
    key: 'DEVELOPER',
    email: `developer@${TEST_EMAIL_DOMAIN}`,
    displayName: 'RLS Test Developer',
    roles: ['developer'],
  },
];

/**
 * Create all test users
 * Returns map of user keys to user IDs
 */
export async function createTestUsers(
  serviceClient: SupabaseClient
): Promise<TestUserIds> {
  const userIds: Record<string, string> = {};

  for (const user of TEST_USERS) {
    try {
      // Check if user already exists
      const { data: existingProfile } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (existingProfile) {
        // User already exists, use existing ID
        userIds[user.key] = existingProfile.id;
        console.log(`  ✓ Using existing test user: ${user.key}`);
        continue;
      }

      // Create new user via auth API
      const { data: authData, error: authError } =
        await serviceClient.auth.admin.createUser({
          email: user.email,
          password: TEST_PASSWORD,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            display_name: user.displayName,
          },
        });

      if (authError) {
        console.error(`Failed to create user ${user.key}:`, authError.message);
        throw authError;
      }

      if (!authData.user) {
        throw new Error(`No user returned for ${user.key}`);
      }

      userIds[user.key] = authData.user.id;

      // Update profile with display name
      await serviceClient
        .from('profiles')
        .update({
          display_name: user.displayName,
          email: user.email,
        })
        .eq('id', authData.user.id);

      // Assign roles
      for (const roleName of user.roles) {
        // Get role ID
        const { data: roleData } = await serviceClient
          .from('roles')
          .select('id')
          .eq('name', roleName)
          .maybeSingle();

        if (roleData) {
          // Check if role assignment already exists
          const { data: existingRole } = await serviceClient
            .from('user_roles')
            .select('id')
            .eq('user_id', authData.user.id)
            .eq('role_id', roleData.id)
            .maybeSingle();

          if (!existingRole) {
            await serviceClient.from('user_roles').insert({
              user_id: authData.user.id,
              role_id: roleData.id,
            });
          }
        }
      }

      console.log(`  ✓ Created test user: ${user.key}`);
    } catch (error) {
      console.error(`Error creating test user ${user.key}:`, error);
      throw error;
    }
  }

  return userIds as TestUserIds;
}

/**
 * Clean up all test users and their data
 */
export async function cleanupTestUsers(
  serviceClient: SupabaseClient
): Promise<void> {
  console.log('Cleaning up test users...');

  // Find all test users by email domain
  const { data: testProfiles } = await serviceClient
    .from('profiles')
    .select('id, email')
    .like('email', `%@${TEST_EMAIL_DOMAIN}`);

  if (!testProfiles || testProfiles.length === 0) {
    console.log('  No test users to clean up');
    return;
  }

  const testUserIds = testProfiles.map((p) => p.id);

  // Delete test data in order (respecting foreign keys)

  // 1. Delete order items for test user orders
  const { data: testOrders } = await serviceClient
    .from('orders')
    .select('id')
    .in('user_id', testUserIds);

  if (testOrders && testOrders.length > 0) {
    const orderIds = testOrders.map((o) => o.id);
    await serviceClient.from('order_items').delete().in('order_id', orderIds);
    await serviceClient.from('tickets').delete().in('order_id', orderIds);
    await serviceClient.from('orders').delete().in('id', orderIds);
  }

  // 2. Delete user roles
  await serviceClient.from('user_roles').delete().in('user_id', testUserIds);

  // 3. Delete users via auth API
  for (const profile of testProfiles) {
    try {
      await serviceClient.auth.admin.deleteUser(profile.id);
      console.log(`  ✓ Deleted test user: ${profile.email}`);
    } catch (error) {
      console.error(`Failed to delete user ${profile.email}:`, error);
    }
  }
}

/**
 * Get test user email by key
 */
export function getTestUserEmail(key: keyof TestUserIds): string {
  const user = TEST_USERS.find((u) => u.key === key);
  if (!user) {
    throw new Error(`Unknown test user key: ${key}`);
  }
  return user.email;
}
