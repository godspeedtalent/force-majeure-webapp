# Networking, API & Authorization Audit - Execution Plan

**Generated:** 2026-01-24
**Status:** Ready for Execution
**Estimated Total Effort:** 80-100 hours over 4 weeks

---

## 📊 Audit Summary

Comprehensive audit of Force Majeure's networking, API fetching, and authorization systems completed. Four detailed security documents created in `docs/security/`:

1. **RLS_AUDIT_REPORT.md** - Complete RLS policy audit (100+ tables)
2. **RLS_TEST_SUITE.md** - Automated testing framework
3. **PERMISSION_ARCHITECTURE.md** - Client vs Server security model
4. **CRITICAL_RLS_FINDINGS.md** - 7 critical findings + action items
5. **RLS_COMPLIANCE_CHECKLIST.md** - Policy creation/review checklist

---

## 🎯 Overall Assessment

### ✅ Strengths
- Strong architectural patterns (React Query, centralized error handling, permission system)
- Extensive RLS coverage (128+ policy migrations)
- Active maintenance (recent security fixes)
- Type-safe permission constants
- Protected route implementation

### ⚠️ Concerns
- No automated RLS test suite (security bugs found manually)
- Recent recursion bugs in RLS policies (systemic issue)
- 20+ files using deprecated mutation hooks
- Incomplete error handler adoption
- No retry logic on API calls

### 🔴 Critical Gaps
- RLS recursion bugs need systematic fixing
- User roles table security needs verification
- Promo code security needs audit
- Client-side permission checks create false sense of security

---

## 📋 Execution Plan

### Phase 1: Immediate Actions (Week 1) - 28 hours

#### 🔴 Priority 1: Fix RLS Recursion Bugs (8 hours)

**Problem:** RLS helper functions cause infinite loops

**Files to Review:**
- All functions used in RLS policies
- Search for: `CREATE FUNCTION` in migrations
- Focus on: `has_role()`, `is_organization_staff()`, `is_event_staff()`

**Fix Pattern:**
```sql
-- Add SECURITY DEFINER to bypass RLS in helper functions
CREATE OR REPLACE FUNCTION is_organization_staff(user_id uuid, org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_staff
    WHERE user_id = $1 AND organization_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- ⭐ Add this

-- Add explanatory comment
COMMENT ON FUNCTION is_organization_staff IS
'Checks if user is staff of organization.
SECURITY DEFINER bypasses RLS to prevent recursion.';
```

**Verification:**
- [ ] List all RLS helper functions
- [ ] Identify which tables each queries
- [ ] Check if those tables have RLS using those functions
- [ ] Add SECURITY DEFINER to break circular dependencies
- [ ] Test queries don't hang or fail
- [ ] Document each function's security model

**Files to Create:**
- `supabase/migrations/YYYYMMDD_fix_rls_helper_function_recursion.sql`

---

#### 🔴 Priority 2: Implement RLS Test Suite (16 hours)

**Goal:** Automated tests for 6 critical tables

**Step 1: Setup Test Framework (4 hours)**

Create directory structure:
```
supabase/functions/rls-tests/
├── index.ts                  # Main test runner
├── fixtures/
│   ├── users.ts             # Test user creation
│   └── data.ts              # Test data setup
├── tests/
│   ├── orders.test.ts       # Orders table tests
│   ├── profiles.test.ts     # Profiles table tests
│   ├── tickets.test.ts      # Tickets table tests
│   ├── user-roles.test.ts   # User roles tests
│   ├── promo-codes.test.ts  # Promo codes tests
│   └── order-items.test.ts  # Order items tests
└── utils/
    ├── assert.ts            # Test assertions
    └── auth.ts              # Auth context switching
```

**Step 2: Create Test Users (2 hours)**
```typescript
// Test personas needed:
- ADMIN (has admin role)
- USER_A (regular user)
- USER_B (regular user, for cross-user tests)
- ORG_ADMIN (organization admin)
- ORG_STAFF (organization staff)
- ARTIST (artist role)
- DEVELOPER (developer role)
```

**Step 3: Write Test Cases (10 hours)**

**For each table, test:**
1. Anonymous access (should be denied for sensitive tables)
2. User viewing own data (should succeed)
3. User viewing other user's data (should be denied)
4. Admin viewing all data (should succeed)
5. User modifying own data (depends on table)
6. User modifying other's data (should be denied)

**Priority tables:**
- `orders` (2 hours)
- `order_items` (1.5 hours)
- `tickets` (2 hours)
- `profiles` (2 hours)
- `user_roles` (1.5 hours)
- `promo_codes` (1 hour)

**Files to Reference:**
- See `docs/security/RLS_TEST_SUITE.md` for complete framework
- Copy patterns from example test cases

**Success Criteria:**
- [ ] Test suite runs via Edge Function
- [ ] All 6 critical tables have tests
- [ ] Tests cover positive and negative cases
- [ ] CI/CD integration ready (GitHub Actions)

---

#### 🟡 Priority 3: Verify Critical Table Security (4 hours)

**Manual audit of high-risk tables:**

**3.1: User Roles Table (1 hour)**
```bash
# Check existing policies
psql -c "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_roles';"

# Test scenarios:
1. Can regular user INSERT role for themselves? (should fail)
2. Can regular user UPDATE their roles? (should fail)
3. Can regular user DELETE their roles? (should fail)
4. Can admin manage all roles? (should succeed)
```

**Expected policies:**
- [ ] Users can view own roles (SELECT)
- [ ] Only admins can insert roles (INSERT)
- [ ] Only admins can update roles (UPDATE)
- [ ] Only admins can delete roles (DELETE)

**3.2: Promo Codes Table (1 hour)**
```bash
# Check existing policies
psql -c "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'promo_codes';"

# Test scenarios:
1. Can regular user list all promo codes? (should fail)
2. Can user apply code via validation function? (should work)
3. Can org admin view their org's codes? (should succeed)
4. Can admin view all codes? (should succeed)
```

**Expected behavior:**
- [ ] NO public SELECT policy (codes shouldn't be listable)
- [ ] Validation via RPC function only
- [ ] Org-scoped access for org admins
- [ ] Full access for admins

**3.3: Orders/Tickets Tables (2 hours)**
```bash
# Test cross-user access
# As User A, try to query User B's order:
SELECT * FROM orders WHERE user_id = '<user_b_id>';
# Should return 0 rows

# As User A, try to update User B's order:
UPDATE orders SET status = 'cancelled' WHERE user_id = '<user_b_id>';
# Should fail or affect 0 rows

# Similar tests for tickets table
```

**Create Report:**
- [ ] Document findings in `docs/security/CRITICAL_TABLE_AUDIT_RESULTS.md`
- [ ] List any issues found
- [ ] Create migration to fix issues

---

### Phase 2: Short Term (Weeks 2-4) - 52 hours

#### Task 4: Migrate Deprecated Hooks (12 hours)

**Problem:** 20+ files using `useMutationWithToast` (deprecated)

**Step 1: Inventory (2 hours)**
```bash
# Find all usages
grep -r "useMutationWithToast" src/ --include="*.tsx" --include="*.ts"

# Create list of files
# Expected: ~20-25 files
```

**Step 2: Create Migration Script (4 hours)**
```typescript
// Could create codemod, or manual migration
// Pattern to replace:

// OLD:
import { useMutationWithToast } from '@/shared/hooks/useMutationWithToast';

const mutation = useMutationWithToast({
  mutationFn: async (data) => { ... },
  successMessage: 'Success!',
  errorMessage: 'Failed',
});

// NEW:
import { useAsyncMutation } from '@/shared/hooks/useAsyncMutation';

const mutation = useAsyncMutation({
  mutationFn: async (data) => { ... },
  onSuccess: () => toast.success('Success!'),
  onError: (error) => handleError(error, { title: 'Failed' }),
});
```

**Step 3: Update All Files (6 hours)**
- [ ] Update imports
- [ ] Update hook usage
- [ ] Test each component
- [ ] Commit in batches (5 files at a time)

**Files Known to Need Updates:**
- `src/components/admin/UserRequestsAdmin.tsx`
- `src/components/events/artists/UndercardRequestsList.tsx`
- `src/components/reports/ReportHistoryTable.tsx`
- +17 more (find via grep)

**Success Criteria:**
- [ ] All files use `useAsyncMutation`
- [ ] No imports of `useMutationWithToast`
- [ ] All functionality works as before
- [ ] Remove deprecated hook file

---

#### Task 5: Standardize Admin Bypass Pattern (12 hours)

**Goal:** Ensure all RLS policies include admin/developer access

**Step 1: Audit All Policies (4 hours)**
```sql
-- Get all policies
SELECT
  tablename,
  policyname,
  cmd,
  qual as using_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check which are missing admin bypass
-- Look for policies without has_role(auth.uid(), 'admin')
```

**Step 2: Identify Missing Admin Access (2 hours)**
- [ ] Create spreadsheet of all tables
- [ ] Mark which have admin bypass
- [ ] Mark which are missing it
- [ ] Classify exceptions (intentionally no admin access)

**Step 3: Create Fix Migration (6 hours)**
```sql
-- Pattern for consolidating policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

CREATE POLICY "Users can view own orders, admins can view all"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    user_id = auth.uid()
  );

-- Repeat for ~20-30 tables
```

**File to Create:**
- `supabase/migrations/YYYYMMDD_standardize_admin_bypass_pattern.sql`

---

#### Task 6: Add Retry Logic to React Query (4 hours)

**Problem:** Failed API calls don't retry

**Step 1: Configure Query Client (1 hour)**
```typescript
// src/lib/reactQuery.ts

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,  // Retry failed queries 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,  // Retry mutations once
      retryDelay: 1000,
    },
  },
});
```

**Step 2: Add Network Error Detection (2 hours)**
```typescript
// Enhance error handler to detect retryable errors
export function isRetryableError(error: unknown): boolean {
  if (isNetworkError(error)) return true;

  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    // Retry on 5xx errors (server issues) and 429 (rate limit)
    return status >= 500 || status === 429;
  }

  return false;
}

// Update queryClient to use this
retry: (failureCount, error) => {
  if (!isRetryableError(error)) return false;
  return failureCount < 3;
},
```

**Step 3: Test Retry Behavior (1 hour)**
- [ ] Simulate network failure
- [ ] Verify automatic retry
- [ ] Verify exponential backoff
- [ ] Verify toast messages appear correctly

---

#### Task 7: Consolidate Error Handler Adoption (12 hours)

**Problem:** Not all services use centralized error handler

**Step 1: Find Non-Compliant Files (2 hours)**
```bash
# Find direct logger.error usage
grep -r "logger.error" src/shared/services/ --include="*.ts"

# Find direct toast.error usage
grep -r "toast.error" src/shared/services/ --include="*.ts"

# Should find:
# - featureFlagService.ts
# - useFeatureFlags.ts (hook, but similar pattern)
# - useRoles.ts
# - Others
```

**Step 2: Update Services (8 hours)**
```typescript
// Pattern to replace:

// OLD (featureFlagService.ts lines 60-76):
if (error) {
  logger.error('Error checking feature flag', {
    error: error.message,
    source: 'featureFlagService.isFeatureEnabled',
  });
  return false;
}

// NEW:
import { handleError } from '@/shared/services/errorHandler';

if (error) {
  handleError(error, {
    title: 'Feature flag check failed',
    context: 'featureFlagService.isFeatureEnabled',
    silent: true,  // Don't show toast for background checks
  });
  return false;
}
```

**Files to Update:**
- `src/shared/services/featureFlagService.ts`
- `src/shared/hooks/useFeatureFlags.ts`
- `src/shared/hooks/useRoles.ts`
- Others found in grep

**Step 3: Update Error Handler (2 hours)**
```typescript
// Add 'silent' option to suppress toasts for background operations
export interface ErrorHandlerOptions {
  title?: string;
  context?: string;
  endpoint?: string;
  silent?: boolean;  // ⭐ Add this
}

export async function handleError(error: unknown, options: ErrorHandlerOptions) {
  // ... existing logic ...

  // Only show toast if not silent
  if (!options.silent) {
    toast.error(finalTitle, { description: finalDescription });
  }

  // Always log
  logger.error(/* ... */);
}
```

---

#### Task 8: Expand RLS Test Coverage (12 hours)

**Goal:** Test 15 additional tables (total 21 tables with tests)

**Priority 2 Tables (8 hours):**
- `organizations` (1 hour)
- `organization_staff` (1 hour)
- `events` (1.5 hours)
- `ticket_tiers` (1 hour)
- `event_staff` (1 hour)
- `artist_registrations` (1.5 hours)
- `screening_submissions` (1 hour)

**Priority 3 Tables (4 hours):**
- `venues` (0.5 hours)
- `artists` (0.5 hours)
- `genres` (0.5 hours)
- `activity_logs` (1 hour)
- `error_logs` (1 hour)
- `feature_flags` (0.5 hours)

**Test Pattern (same for all):**
1. Anonymous access test
2. User own-data test
3. Cross-user access test (negative)
4. Admin access test
5. Role-based access test (if applicable)

---

### Phase 3: Medium Term (Months 2-3) - TBD

#### Task 9: Complete RLS Coverage Audit (40 hours)

**Goal:** Verify all 100+ tables have proper RLS

**Process:**
1. Generate table list from types.ts (done - see RLS_AUDIT_REPORT.md)
2. For each table:
   - Check if RLS enabled
   - Check policies exist
   - Verify policy logic
   - Add to test suite
   - Document in audit report

**Deliverable:**
- Updated `RLS_AUDIT_REPORT.md` with 100% coverage

---

#### Task 10: External Security Audit (External Contractor)

**Scope:**
- RLS policy review
- Penetration testing
- Access control verification
- Compliance check (if needed for GDPR, PCI-DSS, etc.)

**Tables to Focus:**
- Financial: `orders`, `order_items`, `tickets`, `promo_codes`
- PII: `profiles`, `addresses`, `guests`
- Access Control: `user_roles`, `organization_staff`

---

#### Task 11: Performance Optimization (8 hours)

**Goal:** Improve RLS policy performance

**Step 1: Identify Slow Policies (2 hours)**
```sql
-- Enable query logging
ALTER DATABASE your_db SET log_min_duration_statement = 1000; -- Log queries > 1s

-- Monitor slow queries
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%FROM orders%'
ORDER BY mean_exec_time DESC;
```

**Step 2: Add Missing Indexes (4 hours)**
```sql
-- Common indexes for RLS
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order_id ON tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_staff_user_id ON organization_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_staff_organization_id ON organization_staff(organization_id);
-- Add more as needed
```

**Step 3: Simplify Complex Policies (2 hours)**
- Identify policies with subqueries
- Consider materialized views
- Use SECURITY DEFINER functions wisely

---

## 🎯 Success Metrics

### Week 1 ✅
- [ ] Zero recursion bugs in production
- [ ] RLS test suite running (6 critical tables)
- [ ] Critical table security verified
- [ ] Migration error fixed ✅ (already done)

### Month 1 ✅
- [ ] 21+ tables have automated tests
- [ ] All deprecated hooks migrated
- [ ] Admin bypass standardized across all tables
- [ ] Retry logic enabled
- [ ] Error handler adopted by all services
- [ ] CI/CD blocks insecure migrations

### Month 3 ✅
- [ ] 80%+ tables tested
- [ ] External security audit completed
- [ ] Performance optimized
- [ ] Documentation complete
- [ ] Zero critical security findings

---

## 🔧 Tools & Commands

### Useful SQL Queries

**List all tables without RLS:**
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = true
);
```

**List all policies for a table:**
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'your_table_name';
```

**Check table permissions:**
```sql
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'your_table_name';
```

### Running RLS Tests

**Local:**
```bash
# Start Supabase locally
supabase start

# Call test function
curl -X POST http://localhost:54321/functions/v1/rls-tests \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"
```

**From Dev Toolbar:**
```typescript
// Button in FmToolbar > Developer tab
<FmCommonButton onClick={runRLSTests}>
  🧪 Run RLS Tests
</FmCommonButton>
```

### CI/CD Integration

**GitHub Actions:**
```yaml
# .github/workflows/rls-tests.yml
name: RLS Tests
on:
  pull_request:
    paths:
      - 'supabase/migrations/**'
jobs:
  rls-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: supabase start
      - run: supabase db push
      - run: curl -X POST http://localhost:54321/functions/v1/rls-tests
      - run: check exit code
```

---

## 📚 Documentation References

All detailed documentation in `docs/security/`:

1. **RLS_AUDIT_REPORT.md**
   - Full table inventory
   - Policy patterns
   - Migration history
   - Action items

2. **RLS_TEST_SUITE.md**
   - Complete test framework
   - Example test cases
   - CI/CD integration
   - Developer workflow

3. **PERMISSION_ARCHITECTURE.md**
   - Client vs Server security model
   - Permission flow diagrams
   - Attack scenarios
   - Best practices

4. **CRITICAL_RLS_FINDINGS.md**
   - 7 critical findings
   - Detailed fix recommendations
   - Risk assessment
   - Timeline

5. **RLS_COMPLIANCE_CHECKLIST.md**
   - New table checklist
   - Audit checklist
   - Policy patterns
   - Security considerations

---

## 👥 Team Assignment Recommendations

**Security Team (Weeks 1-4):**
- RLS recursion fixes
- Critical table audits
- Test suite implementation
- External audit coordination

**Backend Team (Weeks 2-8):**
- Deprecated hook migration
- Error handler adoption
- Service layer consolidation
- Performance optimization

**DevOps Team (Weeks 1-2):**
- CI/CD integration
- Test automation
- Monitoring setup

**Frontend Team (As needed):**
- Support hook migration
- Update components affected by backend changes
- Test user flows

---

## 🚨 Risk Management

### High Risk Items
- **RLS recursion bugs** - Can cause production outages
- **Missing role security** - Could allow privilege escalation
- **Promo code security** - Financial impact if exploited

**Mitigation:** Prioritize Week 1 tasks, implement test suite ASAP

### Medium Risk Items
- **Deprecated hooks** - Technical debt, not security risk
- **Missing admin bypass** - Impacts admin UX, not security
- **No retry logic** - UX issue, not security risk

**Mitigation:** Address in Weeks 2-4, lower urgency

---

## 📞 Support & Questions

**For questions about:**
- RLS policies → See `PERMISSION_ARCHITECTURE.md`
- Testing → See `RLS_TEST_SUITE.md`
- New tables → See `RLS_COMPLIANCE_CHECKLIST.md`
- Specific findings → See `CRITICAL_RLS_FINDINGS.md`

**Need help?**
- Review documentation first
- Check existing migrations for patterns
- Consult security team for critical changes

---

## ✅ Pre-Flight Checklist

Before starting execution:

- [ ] Read all 5 security documents in `docs/security/`
- [ ] Understand client vs server permission model
- [ ] Review critical findings and priorities
- [ ] Set up local Supabase environment
- [ ] Create feature branch for RLS work
- [ ] Coordinate with team on timeline
- [ ] Back up database before making changes
- [ ] Have rollback plan ready

---

## 🎯 Quick Start

**To begin immediately:**

1. **Fix the migration error** ✅ (already fixed)
   - Migration `20260124214140` now has proper DROP statements

2. **Start with recursion fixes** (highest impact, 8 hours)
   - Create new migration: `YYYYMMDD_fix_rls_helper_recursion.sql`
   - Add SECURITY DEFINER to all helper functions
   - Test queries don't hang

3. **Set up test framework** (enables everything else, 4 hours)
   - Create `supabase/functions/rls-tests/` directory
   - Copy framework from `RLS_TEST_SUITE.md`
   - Test runner working locally

4. **Write first test** (validate framework, 2 hours)
   - Create `tests/orders.test.ts`
   - Test user can view own orders
   - Test user cannot view other orders
   - Test admin can view all orders

Once these 4 steps are done (14 hours total), the foundation is set for all remaining work.

---

**Ready to execute?** Start with Week 1, Priority 1 (recursion fixes). Let's secure this thing! 🔒
