/**
 * RLS Test Suite - Main Entry Point
 *
 * Edge Function that runs comprehensive RLS (Row-Level Security) tests
 * for critical database tables. Requires admin or developer role to run.
 *
 * Usage:
 *   POST /functions/v1/rls-tests
 *   Authorization: Bearer <access_token>
 *
 * Returns:
 *   - 200 with results if all tests pass
 *   - 500 with results if any tests fail
 *   - 401 if not authorized
 *   - 403 if user lacks required role
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { verifyAuth, requireAnyRole } from '../_shared/auth.ts';
import { createServiceClient } from './utils/auth.ts';
import { createTestUsers, cleanupTestUsers, TestUserIds } from './fixtures/users.ts';
import { setupTestData, cleanupTestData, TestData } from './fixtures/data.ts';
import { testOrdersRLS } from './tests/orders.test.ts';
import { testProfilesRLS } from './tests/profiles.test.ts';
import { testTicketsRLS } from './tests/tickets.test.ts';
import { testUserRolesRLS } from './tests/user-roles.test.ts';
import { testPromoCodesRLS } from './tests/promo-codes.test.ts';
import { testOrderItemsRLS } from './tests/order-items.test.ts';
import { RLSTestError } from './utils/assert.ts';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: unknown;
  duration: number;
}

export interface TestSuiteResult {
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
  timestamp: string;
}

/**
 * Run a single test with error handling and timing
 */
export async function runTest(
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
    const duration = Date.now() - startTime;

    if (error instanceof RLSTestError) {
      return {
        name,
        passed: false,
        error: error.message,
        details: error.details,
        duration,
      };
    }

    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration,
    };
  }
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Verify authentication and authorization
    const { user, supabase } = await verifyAuth(req);
    await requireAnyRole(supabase, user.id, ['admin', 'developer']);

    console.log('🧪 Starting RLS Test Suite...');
    console.log(`   Initiated by: ${user.email}`);
    const suiteStartTime = Date.now();

    // Initialize service client for test setup
    const serviceClient = createServiceClient();

    // Step 1: Create or reuse test users
    console.log('\n📝 Setting up test users...');
    let userIds: TestUserIds;
    try {
      userIds = await createTestUsers(serviceClient);
    } catch (error) {
      console.error('Failed to create test users:', error);
      throw new Error(`Test setup failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Step 2: Set up test data
    console.log('\n📦 Setting up test data...');
    let testData: TestData;
    try {
      testData = await setupTestData(serviceClient, userIds);
    } catch (error) {
      console.error('Failed to set up test data:', error);
      // Try to clean up users before throwing
      await cleanupTestUsers(serviceClient);
      throw new Error(`Test data setup failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Step 3: Run all test modules
    console.log('\n🚀 Running RLS tests...');
    const allResults: TestResult[] = [];

    // Run tests for each critical table
    console.log('\n  📋 Testing Orders table...');
    allResults.push(...await testOrdersRLS(testData));

    console.log('  📋 Testing Profiles table...');
    allResults.push(...await testProfilesRLS(testData));

    console.log('  📋 Testing Tickets table...');
    allResults.push(...await testTicketsRLS(testData));

    console.log('  📋 Testing User Roles table...');
    allResults.push(...await testUserRolesRLS(testData));

    console.log('  📋 Testing Promo Codes table...');
    allResults.push(...await testPromoCodesRLS(testData));

    console.log('  📋 Testing Order Items table...');
    allResults.push(...await testOrderItemsRLS(testData));

    // Step 4: Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      await cleanupTestData(serviceClient, testData);
    } catch (error) {
      console.error('Warning: Test data cleanup failed:', error);
    }

    // Note: We don't clean up test users by default
    // They can be reused for faster subsequent test runs
    // Uncomment below to always clean up users:
    // await cleanupTestUsers(serviceClient);

    // Step 5: Calculate and return results
    const suiteDuration = Date.now() - suiteStartTime;
    const passed = allResults.filter((r) => r.passed).length;
    const failed = allResults.filter((r) => !r.passed).length;

    const summary: TestSuiteResult = {
      totalTests: allResults.length,
      passed,
      failed,
      duration: suiteDuration,
      results: allResults,
      timestamp: new Date().toISOString(),
    };

    // Log summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 RLS Test Suite Results');
    console.log('='.repeat(50));
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   ✅ Passed: ${summary.passed}`);
    console.log(`   ❌ Failed: ${summary.failed}`);
    console.log(`   ⏱️  Duration: ${summary.duration}ms`);
    console.log('='.repeat(50));

    // Log failed tests
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      allResults
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`   • ${r.name}`);
          console.log(`     Error: ${r.error}`);
          if (r.details) {
            console.log(`     Details: ${JSON.stringify(r.details)}`);
          }
        });
    }

    return new Response(JSON.stringify(summary, null, 2), {
      status: failed > 0 ? 500 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('💥 Test suite failed:', error);

    // Determine appropriate status code
    let status = 500;
    let errorMessage = 'Test suite failed';

    if (error instanceof Error) {
      errorMessage = error.message;
      if (errorMessage.includes('Unauthorized')) {
        status = 401;
      } else if (errorMessage.includes('Forbidden')) {
        status = 403;
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
