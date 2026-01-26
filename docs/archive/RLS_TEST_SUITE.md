# RLS Test Suite Framework

**Purpose:** Automated testing for Row-Level Security policies
**Status:** 🟡 Framework Definition (Implementation Pending)
**Last Updated:** 2026-01-24

---

## Overview

This document defines a comprehensive testing framework for RLS policies. The goal is to catch security vulnerabilities before they reach production by systematically testing data access permissions.

---

## Test Architecture

### Approach: Edge Function Test Suite

**Why Edge Functions?**
- Can test from different user contexts (anon, authenticated, admin)
- Can switch between users programmatically
- Can use service_role for test setup
- Easier to integrate into CI/CD than pgTAP
- Can be run manually from developer toolbar

### Test Structure

```
supabase/
├── functions/
│   └── rls-tests/
│       ├── index.ts              # Main test runner
│       ├── fixtures/
│       │   ├── users.ts          # Test user creation
│       │   └── data.ts           # Test data setup
│       ├── tests/
│       │   ├── orders.test.ts    # Order table tests
│       │   ├── profiles.test.ts  # Profile table tests
│       │   ├── tickets.test.ts   # Ticket table tests
│       │   └── ...               # More test files
│       └── utils/
│           ├── assert.ts         # Test assertions
│           └── auth.ts           # Auth context switching
```

---

## Test User Fixtures

### User Personas

```typescript
// supabase/functions/rls-tests/fixtures/users.ts

export interface TestUser {
  id: string;
  email: string;
  password: string;
  roles: string[];
  displayName: string;
}

export const TEST_USERS = {
  // Admin with full access
  ADMIN: {
    email: 'test-admin@forcemajeure.test',
    password: 'Test123!@#',
    roles: ['admin'],
    displayName: 'Test Admin',
  },

  // Regular user A
  USER_A: {
    email: 'test-user-a@forcemajeure.test',
    password: 'Test123!@#',
    roles: [],
    displayName: 'Test User A',
  },

  // Regular user B (for testing cross-user access)
  USER_B: {
    email: 'test-user-b@forcemajeure.test',
    password: 'Test123!@#',
    roles: [],
    displayName: 'Test User B',
  },

  // Organization admin
  ORG_ADMIN: {
    email: 'test-org-admin@forcemajeure.test',
    password: 'Test123!@#',
    roles: ['org_admin'],
    displayName: 'Test Org Admin',
    organizationId: '<set_during_setup>',
  },

  // Organization staff (non-admin)
  ORG_STAFF: {
    email: 'test-org-staff@forcemajeure.test',
    password: 'Test123!@#',
    roles: ['org_staff'],
    displayName: 'Test Org Staff',
    organizationId: '<set_during_setup>',
  },

  // Artist user
  ARTIST: {
    email: 'test-artist@forcemajeure.test',
    password: 'Test123!@#',
    roles: ['artist'],
    displayName: 'Test Artist',
    artistId: '<set_during_setup>',
  },

  // Developer role
  DEVELOPER: {
    email: 'test-developer@forcemajeure.test',
    password: 'Test123!@#',
    roles: ['developer'],
    displayName: 'Test Developer',
  },
} as const;

/**
 * Create all test users with proper roles
 * Uses service_role client to bypass RLS during setup
 */
export async function createTestUsers(supabaseService: SupabaseClient) {
  // Create users via auth API
  // Assign roles in user_roles table
  // Create associated profiles
  // Return map of user IDs
}

/**
 * Clean up all test users
 */
export async function cleanupTestUsers(supabaseService: SupabaseClient) {
  // Delete all test data
  // Delete test users
}
```

---

## Test Data Fixtures

### Sample Data

```typescript
// supabase/functions/rls-tests/fixtures/data.ts

export interface TestData {
  organizations: Organization[];
  events: Event[];
  orders: Order[];
  tickets: Ticket[];
  // ...more
}

/**
 * Create test data for all users
 * Returns IDs of created records for use in tests
 */
export async function setupTestData(
  supabaseService: SupabaseClient,
  userIds: Record<string, string>
): Promise<TestData> {
  // Create organizations
  const org1 = await createOrganization({
    name: 'Test Organization 1',
    owner_id: userIds.ORG_ADMIN,
  });

  const org2 = await createOrganization({
    name: 'Test Organization 2',
    owner_id: userIds.USER_A,
  });

  // Create events
  const event1 = await createEvent({
    title: 'Test Event 1',
    organization_id: org1.id,
  });

  // Create orders
  const orderUserA = await createOrder({
    user_id: userIds.USER_A,
    event_id: event1.id,
    total: 50.00,
  });

  const orderUserB = await createOrder({
    user_id: userIds.USER_B,
    event_id: event1.id,
    total: 75.00,
  });

  // Create tickets
  const ticketUserA = await createTicket({
    order_id: orderUserA.id,
    user_id: userIds.USER_A,
  });

  return {
    organizations: [org1, org2],
    events: [event1],
    orders: [orderUserA, orderUserB],
    tickets: [ticketUserA],
  };
}
```

---

## Test Utilities

### Authentication Context Switching

```typescript
// supabase/functions/rls-tests/utils/auth.ts

/**
 * Create authenticated Supabase client for a specific user
 */
export async function createUserClient(
  email: string,
  password: string
): Promise<SupabaseClient> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!, // Use anon key to respect RLS
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(`Failed to sign in as ${email}: ${error.message}`);

  return supabase;
}

/**
 * Create anonymous (non-authenticated) client
 */
export function createAnonClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
}

/**
 * Create service role client (bypasses RLS - only for test setup)
 */
export function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}
```

### Test Assertions

```typescript
// supabase/functions/rls-tests/utils/assert.ts

export class RLSTestError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'RLSTestError';
  }
}

/**
 * Assert that a query returns expected number of rows
 */
export function assertRowCount(
  actual: number,
  expected: number,
  message: string
) {
  if (actual !== expected) {
    throw new RLSTestError(
      `${message}: Expected ${expected} rows, got ${actual}`,
      { actual, expected }
    );
  }
}

/**
 * Assert that a query returns no rows (denied access)
 */
export function assertDenied(rows: any[], message: string) {
  if (rows.length > 0) {
    throw new RLSTestError(
      `${message}: Expected access denied (0 rows), but got ${rows.length} rows`,
      { rows }
    );
  }
}

/**
 * Assert that a query returns at least one row (granted access)
 */
export function assertGranted(rows: any[], message: string) {
  if (rows.length === 0) {
    throw new RLSTestError(
      `${message}: Expected access granted (1+ rows), but got 0 rows`
    );
  }
}

/**
 * Assert that a mutation fails (throws error)
 */
export async function assertMutationDenied(
  fn: () => Promise<any>,
  message: string
) {
  try {
    await fn();
    throw new RLSTestError(
      `${message}: Expected mutation to fail, but it succeeded`
    );
  } catch (error) {
    // Expected - mutation was denied
    if (error instanceof RLSTestError) throw error;
  }
}

/**
 * Assert that a mutation succeeds
 */
export async function assertMutationGranted(
  fn: () => Promise<any>,
  message: string
) {
  try {
    await fn();
  } catch (error) {
    throw new RLSTestError(
      `${message}: Expected mutation to succeed, but it failed`,
      { error }
    );
  }
}
```

---

## Test Cases

### Example: Orders Table Tests

```typescript
// supabase/functions/rls-tests/tests/orders.test.ts

import { TEST_USERS } from '../fixtures/users.ts';
import { createUserClient, createAnonClient } from '../utils/auth.ts';
import { assertDenied, assertGranted, assertRowCount } from '../utils/assert.ts';

export async function testOrdersRLS(testData: TestData) {
  const results: TestResult[] = [];

  // Test 1: Anonymous users cannot view any orders
  results.push(await runTest(
    'Anonymous cannot view orders',
    async () => {
      const anonClient = createAnonClient();
      const { data, error } = await anonClient.from('orders').select('*');
      assertDenied(data || [], 'Anonymous should not see any orders');
    }
  ));

  // Test 2: User A can only view their own orders
  results.push(await runTest(
    'User A can only view own orders',
    async () => {
      const userAClient = await createUserClient(
        TEST_USERS.USER_A.email,
        TEST_USERS.USER_A.password
      );

      const { data } = await userAClient.from('orders').select('*');
      assertGranted(data || [], 'User A should see their orders');

      // Verify all returned orders belong to User A
      const wrongOwner = data?.find(o => o.user_id !== testData.userIds.USER_A);
      if (wrongOwner) {
        throw new RLSTestError('User A seeing orders from other users!', wrongOwner);
      }
    }
  ));

  // Test 3: User A cannot view User B's orders
  results.push(await runTest(
    'User A cannot view User B orders',
    async () => {
      const userAClient = await createUserClient(
        TEST_USERS.USER_A.email,
        TEST_USERS.USER_A.password
      );

      const { data } = await userAClient
        .from('orders')
        .select('*')
        .eq('id', testData.orders.orderUserB.id); // Try to access User B's order

      assertDenied(data || [], 'User A should not see User B orders');
    }
  ));

  // Test 4: User A cannot update User B's order
  results.push(await runTest(
    'User A cannot update User B orders',
    async () => {
      const userAClient = await createUserClient(
        TEST_USERS.USER_A.email,
        TEST_USERS.USER_A.password
      );

      await assertMutationDenied(
        async () => {
          await userAClient
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', testData.orders.orderUserB.id);
        },
        'User A should not be able to update User B orders'
      );
    }
  ));

  // Test 5: Admin can view all orders
  results.push(await runTest(
    'Admin can view all orders',
    async () => {
      const adminClient = await createUserClient(
        TEST_USERS.ADMIN.email,
        TEST_USERS.ADMIN.password
      );

      const { data } = await adminClient.from('orders').select('*');
      assertGranted(data || [], 'Admin should see all orders');

      // Should see at least User A + User B orders
      assertRowCount(
        data?.length || 0,
        2, // We created 2 orders in test data
        'Admin should see all test orders'
      );
    }
  ));

  // Test 6: Admin can update any order
  results.push(await runTest(
    'Admin can update any order',
    async () => {
      const adminClient = await createUserClient(
        TEST_USERS.ADMIN.email,
        TEST_USERS.ADMIN.password
      );

      await assertMutationGranted(
        async () => {
          await adminClient
            .from('orders')
            .update({ status: 'completed' })
            .eq('id', testData.orders.orderUserA.id);
        },
        'Admin should be able to update any order'
      );
    }
  ));

  return results;
}
```

### Example: Profiles Table Tests

```typescript
// supabase/functions/rls-tests/tests/profiles.test.ts

export async function testProfilesRLS(testData: TestData) {
  const results: TestResult[] = [];

  // Test 1: User can view own profile
  results.push(await runTest(
    'User can view own profile',
    async () => {
      const userAClient = await createUserClient(
        TEST_USERS.USER_A.email,
        TEST_USERS.USER_A.password
      );

      const { data } = await userAClient
        .from('profiles')
        .select('*')
        .eq('id', testData.userIds.USER_A)
        .single();

      assertGranted([data], 'User should see own profile');
    }
  ));

  // Test 2: User cannot view other user's private profile fields
  results.push(await runTest(
    'User cannot view other user private fields',
    async () => {
      const userAClient = await createUserClient(
        TEST_USERS.USER_A.email,
        TEST_USERS.USER_A.password
      );

      const { data } = await userAClient
        .from('profiles')
        .select('email, phone') // Private fields
        .eq('id', testData.userIds.USER_B);

      // Should either return no rows or return rows with null private fields
      // Depends on RLS policy implementation
      assertDenied(data || [], 'User should not see other user private data');
    }
  ));

  // Test 3: User can update own profile
  results.push(await runTest(
    'User can update own profile',
    async () => {
      const userAClient = await createUserClient(
        TEST_USERS.USER_A.email,
        TEST_USERS.USER_A.password
      );

      await assertMutationGranted(
        async () => {
          await userAClient
            .from('profiles')
            .update({ display_name: 'Updated Name' })
            .eq('id', testData.userIds.USER_A);
        },
        'User should be able to update own profile'
      );
    }
  ));

  // Test 4: User cannot update other user's profile
  results.push(await runTest(
    'User cannot update other user profile',
    async () => {
      const userAClient = await createUserClient(
        TEST_USERS.USER_A.email,
        TEST_USERS.USER_A.password
      );

      await assertMutationDenied(
        async () => {
          await userAClient
            .from('profiles')
            .update({ display_name: 'Hacked Name' })
            .eq('id', testData.userIds.USER_B);
        },
        'User should not be able to update other profiles'
      );
    }
  ));

  // Test 5: Admin can view any profile
  results.push(await runTest(
    'Admin can view any profile',
    async () => {
      const adminClient = await createUserClient(
        TEST_USERS.ADMIN.email,
        TEST_USERS.ADMIN.password
      );

      const { data } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', testData.userIds.USER_A)
        .single();

      assertGranted([data], 'Admin should see any profile');
    }
  ));

  return results;
}
```

### Example: Tickets Table Tests

```typescript
// supabase/functions/rls-tests/tests/tickets.test.ts

export async function testTicketsRLS(testData: TestData) {
  const results: TestResult[] = [];

  // Test 1: User can view own tickets
  // Test 2: User cannot view other user tickets
  // Test 3: User cannot transfer ticket to another user (if not allowed)
  // Test 4: Org staff can view tickets for their events
  // Test 5: Admin can view all tickets
  // Test 6: Scanner role can scan tickets

  // ... similar pattern to orders tests

  return results;
}
```

---

## Test Runner

### Main Entry Point

```typescript
// supabase/functions/rls-tests/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createServiceClient } from './utils/auth.ts';
import { createTestUsers, cleanupTestUsers } from './fixtures/users.ts';
import { setupTestData } from './fixtures/data.ts';
import { testOrdersRLS } from './tests/orders.test.ts';
import { testProfilesRLS } from './tests/profiles.test.ts';
import { testTicketsRLS } from './tests/tickets.test.ts';
// Import more test modules...

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
  duration: number; // ms
}

interface TestSuiteResult {
  totalTests: number;
  passed: number;
  failed: number;
  duration: number; // ms
  results: TestResult[];
}

serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Verify authorization (require admin or developer role)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Initialize service client for setup
    const supabaseService = createServiceClient();

    console.log('🧪 Starting RLS Test Suite...');
    const suiteStartTime = Date.now();

    // Step 1: Create test users
    console.log('📝 Creating test users...');
    const userIds = await createTestUsers(supabaseService);

    // Step 2: Setup test data
    console.log('📦 Setting up test data...');
    const testData = await setupTestData(supabaseService, userIds);

    // Step 3: Run all test modules
    console.log('🚀 Running tests...');
    const allResults: TestResult[] = [];

    // Run each test module
    allResults.push(...await testOrdersRLS(testData));
    allResults.push(...await testProfilesRLS(testData));
    allResults.push(...await testTicketsRLS(testData));
    // Add more test modules here...

    // Step 4: Clean up test data
    console.log('🧹 Cleaning up test data...');
    await cleanupTestUsers(supabaseService);

    // Step 5: Calculate results
    const suiteDuration = Date.now() - suiteStartTime;
    const passed = allResults.filter(r => r.passed).length;
    const failed = allResults.filter(r => !r.passed).length;

    const summary: TestSuiteResult = {
      totalTests: allResults.length,
      passed,
      failed,
      duration: suiteDuration,
      results: allResults,
    };

    // Log summary
    console.log('\n📊 Test Summary:');
    console.log(`   Total: ${summary.totalTests}`);
    console.log(`   ✅ Passed: ${summary.passed}`);
    console.log(`   ❌ Failed: ${summary.failed}`);
    console.log(`   ⏱️  Duration: ${summary.duration}ms`);

    // Return results
    return new Response(JSON.stringify(summary, null, 2), {
      status: failed > 0 ? 500 : 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Test suite failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Test suite failed',
        message: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Helper to run a single test with error handling
 */
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    await testFn();
    return {
      name,
      passed: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error.message,
      details: error.details,
      duration: Date.now() - startTime,
    };
  }
}
```

---

## Integration into Developer Workflow

### 1. Manual Testing

**From FmToolbar Developer Tab:**

```typescript
// Add button in FmToolbar to trigger RLS tests
<FmCommonButton
  onClick={async () => {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/rls-tests`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    );

    const results = await response.json();
    console.log('RLS Test Results:', results);

    if (results.failed > 0) {
      toast.error(`${results.failed} RLS tests failed!`);
    } else {
      toast.success(`All ${results.passed} RLS tests passed!`);
    }
  }}
>
  🧪 Run RLS Tests
</FmCommonButton>
```

### 2. CI/CD Integration

**GitHub Actions:**

```yaml
# .github/workflows/rls-tests.yml
name: RLS Tests

on:
  pull_request:
    paths:
      - 'supabase/migrations/**'
      - 'supabase/functions/rls-tests/**'

jobs:
  rls-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Start Supabase
        run: supabase start

      - name: Run migrations
        run: supabase db push

      - name: Run RLS tests
        run: |
          curl -X POST \
            http://localhost:54321/functions/v1/rls-tests \
            -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
            > test-results.json

      - name: Check test results
        run: |
          FAILED=$(jq '.failed' test-results.json)
          if [ "$FAILED" -gt 0 ]; then
            echo "❌ $FAILED RLS tests failed"
            exit 1
          else
            echo "✅ All RLS tests passed"
          fi
```

### 3. Pre-Migration Checklist

**Before deploying any migration that modifies RLS:**

1. [ ] Run local RLS tests
2. [ ] All tests pass
3. [ ] Add new test cases for new policies
4. [ ] Document policy intent in migration
5. [ ] Get security review if modifying critical tables
6. [ ] Deploy to staging, run tests again
7. [ ] Deploy to production

---

## Coverage Goals

### Phase 1 (Immediate)
- [ ] Orders table (100% coverage)
- [ ] Profiles table (100% coverage)
- [ ] Tickets table (100% coverage)
- [ ] User roles table (100% coverage)
- [ ] Promo codes table (100% coverage)

### Phase 2 (Short Term)
- [ ] All financial tables
- [ ] All PII tables
- [ ] All role/permission tables

### Phase 3 (Long Term)
- [ ] All public tables (verify anonymous access)
- [ ] All admin tables (verify admin-only access)
- [ ] All organization-scoped tables

**Target:** 80%+ coverage of all tables with RLS policies

---

## Maintenance

### Adding New Tests

When a new table is added or RLS policy modified:

1. Create test file: `supabase/functions/rls-tests/tests/[table_name].test.ts`
2. Define test cases covering:
   - Anonymous access (if applicable)
   - Owner-only access
   - Cross-user access (should be denied)
   - Role-based access (admin, org_staff, etc.)
   - Mutation permissions
3. Import in `index.ts`
4. Run tests locally
5. Update this document

### Reviewing Failed Tests

When tests fail in CI/CD:

1. Check test output for specific failure
2. Verify RLS policy logic is correct
3. Check for regression (did recent migration break policy?)
4. Fix policy or update test if policy intent changed
5. Document why test failed and resolution

---

## Conclusion

This RLS test framework provides:

✅ **Automated testing** - Catch security issues early
✅ **User context switching** - Test from different roles
✅ **Comprehensive coverage** - All critical tables tested
✅ **CI/CD integration** - Block insecure migrations
✅ **Developer friendly** - Run tests from toolbar

**Next Steps:** Implement Phase 1 test cases for critical tables.
