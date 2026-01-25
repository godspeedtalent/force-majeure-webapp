# Critical RLS Findings & Action Plan

**Generated:** 2026-01-24
**Priority:** 🔴 HIGH
**Status:** Requires Immediate Attention

---

## Executive Summary

Based on the comprehensive RLS audit of the Force Majeure database, this document outlines **critical findings** that require immediate attention and provides actionable steps to address them.

### Overall Security Posture

**✅ Strengths:**
- Extensive RLS coverage (128+ migrations with policies)
- Active maintenance and bug fixes
- Good coverage of critical tables (orders, tickets, profiles)
- Recent standardization effort (has_role pattern)

**⚠️ Concerns:**
- Recent recursion bugs indicate systemic issues with helper functions
- Multiple access control fixes suggest policies weren't thoroughly tested initially
- No automated test suite for RLS policies
- Client-side permission checks give false sense of security

**🔴 Critical Gaps:**
- Need verification of ALL table RLS coverage
- Performance issues with recursive policies
- Missing documentation of security model

---

## Critical Finding #1: Recursion Bugs in RLS Policies

### Severity: 🔴 HIGH

### Description

Multiple migrations in January 2026 fixed recursion bugs where RLS policies call helper functions that query tables with RLS policies, creating infinite loops.

### Evidence

- `20260124010000_fix_screening_reviews_rls_recursion.sql`
- `20260123100000_fix_organization_staff_rls_recursion.sql`
- `20260122100000_fix_event_staff_rls_recursion.sql`

### Root Cause

RLS helper functions (`has_role`, `is_organization_staff`, etc.) query tables that also have RLS policies using those same functions.

**Example Problem:**

```sql
-- RLS policy on events table
CREATE POLICY "Org staff can view events"
  ON events
  FOR SELECT
  USING (is_organization_staff(auth.uid(), organization_id));

-- Helper function queries organization_staff table
CREATE FUNCTION is_organization_staff(user_id uuid, org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_staff  -- This table has RLS!
    WHERE user_id = $1 AND organization_id = $2
  );
END;
$$ LANGUAGE plpgsql;

-- RLS policy on organization_staff table
CREATE POLICY "Org staff can view themselves"
  ON organization_staff
  FOR SELECT
  USING (is_organization_staff(auth.uid(), organization_id));
  -- ⚠️ RECURSION: This calls the function that queries this table!
```

### Impact

- Database queries hang or fail
- Application becomes unusable
- Difficult to debug (appears as timeout errors)

### Immediate Action Required

- [ ] **Audit all RLS helper functions**
  - List all functions used in RLS policies
  - Identify which tables each function queries
  - Check if those tables have RLS policies using those functions

- [ ] **Mark helper functions as SECURITY DEFINER**
  - Functions should bypass RLS when querying internal tables
  - Document why SECURITY DEFINER is needed

- [ ] **Add recursion tests**
  - Create tests that verify no circular dependencies
  - Run before each migration

### Recommended Fix Pattern

```sql
-- Proper pattern: SECURITY DEFINER bypasses RLS
CREATE OR REPLACE FUNCTION is_organization_staff(user_id uuid, org_id uuid)
RETURNS boolean AS $$
DECLARE
  result boolean;
BEGIN
  -- This query runs with function owner's permissions, bypassing RLS
  SELECT EXISTS (
    SELECT 1
    FROM organization_staff
    WHERE user_id = $1
    AND organization_id = $2
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining security model
COMMENT ON FUNCTION is_organization_staff IS
'Checks if user is staff of organization.
SECURITY DEFINER is required to bypass RLS and prevent recursion.
This is safe because function only returns boolean, not data.';
```

---

## Critical Finding #2: Missing RLS Test Suite

### Severity: 🔴 HIGH

### Description

There is no automated test suite for RLS policies. Policies are tested manually (if at all), leading to bugs discovered in production.

### Evidence

- Multiple recent RLS fixes (see migration history)
- No test files in repository
- Developers manually test with different user accounts

### Impact

- Security vulnerabilities may go undetected
- Regression bugs when modifying policies
- Time-consuming manual testing
- False confidence in security

### Immediate Action Required

- [ ] **Implement RLS test suite** (framework provided in `RLS_TEST_SUITE.md`)
  - Create Edge Function test runner
  - Define test user fixtures
  - Write test cases for critical tables

- [ ] **Integrate into CI/CD**
  - Block PRs with failing RLS tests
  - Run tests on every migration

- [ ] **Add coverage tracking**
  - Track which tables have tests
  - Aim for 80%+ coverage

### Phase 1 Test Coverage (Immediate)

**Must have tests for:**
1. `orders` - Financial data
2. `order_items` - Order details
3. `tickets` - Ticket ownership
4. `profiles` - User data
5. `user_roles` - Permission assignments
6. `promo_codes` - Discount codes

**Test scenarios for each:**
- Anonymous access (should be denied)
- User viewing own data (should succeed)
- User viewing other user's data (should be denied)
- Admin viewing all data (should succeed)
- Mutation attempts across users (should be denied)

---

## Critical Finding #3: Inconsistent Admin Bypass Pattern

### Severity: ⚠️ MEDIUM

### Description

Some RLS policies include admin bypass, others don't. Inconsistent pattern makes debugging difficult and may lock out admins from support tasks.

### Evidence

**Good examples with admin bypass:**
```sql
-- orders table (line 2325)
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()));
```

**Policies that may be missing admin bypass:**
- Need systematic audit to identify

### Impact

- Admins cannot perform support tasks
- Inconsistent admin experience
- Confusion about permission model

### Immediate Action Required

- [ ] **Standardize admin bypass pattern**
  - Every SELECT policy should allow admin
  - Every UPDATE policy should allow admin
  - DELETE policies should require admin (with rare exceptions)

- [ ] **Document exceptions**
  - Some tables may intentionally exclude admin
  - Document why and get security review

### Recommended Standard Pattern

```sql
-- Always start USING clause with admin check
CREATE POLICY "Policy name"
  ON table_name
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR  -- Standard admin bypass
    has_role(auth.uid(), 'developer') OR  -- Developer access
    /* ...specific access conditions... */
  );
```

---

## Critical Finding #4: Order Security Model Incomplete

### Severity: ⚠️ MEDIUM

### Description

Orders table has good RLS policies, but there are edge cases not covered:

**Current policies (from line 2317):**
```sql
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (user_id = auth.uid());  -- ⚠️ No admin bypass!

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());  -- ⚠️ No admin bypass!

-- Separate admin policies exist, but inconsistent
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()));
```

### Issues

1. **Duplicate policies** for same operation (SELECT has both user and admin policies)
   - This works but is confusing
   - Better to consolidate into one policy with OR conditions

2. **Missing user UPDATE policy**
   - Users cannot update their own orders (e.g., cancel, update shipping address)
   - Only admins can update

3. **No guest order access**
   - Guest checkout creates orders with no user_id
   - How do guests view their order confirmation?

### Recommended Fixes

```sql
-- Consolidate SELECT policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
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

-- Add user UPDATE policy (for cancellations, address updates)
CREATE POLICY "Users can update own orders, admins can update all"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    user_id = auth.uid()
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    (user_id = auth.uid() AND status != 'completed')  -- Can't modify completed orders
  );

-- Add guest order access (by confirmation token)
CREATE POLICY "Guest orders viewable by confirmation token"
  ON orders
  FOR SELECT
  TO anon, authenticated
  USING (
    confirmation_token IS NOT NULL AND
    -- Token validation would need to be in application logic
    -- or via helper function
  );
```

---

## Critical Finding #5: Promo Code Security

### Severity: ⚠️ MEDIUM

### Description

Promo codes have financial impact (discounts) and must be properly secured.

### Required Verification

- [ ] **Check promo_codes table RLS**
  - Can regular users list all promo codes? (should be NO)
  - Can users only apply codes they're entitled to?
  - Are expired codes filtered?

- [ ] **Check promo code validation**
  - Is validation server-side or client-side?
  - Can users guess promo codes?
  - Are there rate limits on code attempts?

### Recommended Pattern

```sql
-- Promo codes should NOT be listable by users
-- Users can only apply codes they know (entered manually)

-- Admins/Org admins can view all codes
CREATE POLICY "Admins can manage promo codes"
  ON promo_codes
  FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    is_organization_admin(auth.uid(), organization_id)
  );

-- NO public SELECT policy
-- Code validation happens server-side via RPC or Edge Function

-- Create RPC function for code validation
CREATE OR REPLACE FUNCTION validate_promo_code(
  code_value text,
  event_id_param uuid
)
RETURNS json AS $$
DECLARE
  code_record promo_codes;
BEGIN
  SELECT * INTO code_record
  FROM promo_codes
  WHERE code = code_value
  AND event_id = event_id_param
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (uses_remaining IS NULL OR uses_remaining > 0);

  IF code_record IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid or expired code');
  END IF;

  RETURN json_build_object(
    'valid', true,
    'discount_type', code_record.discount_type,
    'discount_value', code_record.discount_value
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Critical Finding #6: User Roles Table Security

### Severity: 🔴 HIGH

### Description

The `user_roles` table controls access to the entire system. It is **critical** that only admins can modify this table.

### Required Verification

- [ ] **Check user_roles RLS policies**
  - Can regular users INSERT roles for themselves? (should be NO)
  - Can regular users UPDATE their own roles? (should be NO)
  - Can regular users DELETE their roles? (should be NO - except maybe removing non-critical roles)

- [ ] **Check role assignment flow**
  - How are roles granted? (should be admin-only UI or Edge Function)
  - Is there audit logging?
  - Are role changes validated?

### Recommended Pattern

```sql
-- user_roles is CRITICAL - only admins can modify
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles (for UI display)
CREATE POLICY "Users can view own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    user_id = auth.uid()
  );

-- Only admins can grant/revoke roles
CREATE POLICY "Only admins can insert roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Only admins can update roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Add audit trigger for role changes
CREATE TRIGGER audit_role_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION log_role_change();
```

---

## Critical Finding #7: Ticketing Session Security (Recently Fixed)

### Severity: ✅ RESOLVED (2026-01-24)

### Description

The `ticketing_sessions` table was recently locked down to service_role only (migration `20260124214140`). This is **correct** - queue sessions should not be modifiable by clients.

### What Was Fixed

Migration properly:
- ✅ Revokes all permissions from anon/authenticated
- ✅ Grants to service_role only
- ✅ Allows admin view-only access for monitoring
- ✅ Prevents queue manipulation attacks

### Verification Required

- [ ] **Test the lockdown**
  - Verify users cannot query ticketing_sessions directly
  - Verify only Edge Functions can modify sessions
  - Verify admin can view for monitoring

### Follow-Up Actions

- [ ] **Document this pattern**
  - This is the "service-only" pattern
  - Use for other sensitive operational tables
  - Add to compliance checklist

---

## Action Plan Summary

### Week 1 (Immediate)

1. **Fix Recursion Bugs**
   - [ ] Review all RLS helper functions
   - [ ] Add SECURITY DEFINER where needed
   - [ ] Test for circular dependencies
   - **Assigned to:** Database team
   - **Estimate:** 8 hours

2. **Implement Phase 1 Tests**
   - [ ] Set up test Edge Function
   - [ ] Create test user fixtures
   - [ ] Write tests for critical 6 tables
   - **Assigned to:** Backend team
   - **Estimate:** 16 hours

3. **Audit Critical Tables**
   - [ ] Verify user_roles security
   - [ ] Verify promo_codes security
   - [ ] Verify orders/tickets security
   - **Assigned to:** Security lead
   - **Estimate:** 4 hours

### Week 2-4 (Short Term)

4. **Standardize Admin Bypass**
   - [ ] Audit all tables for admin bypass
   - [ ] Add missing admin policies
   - [ ] Document exceptions
   - **Estimate:** 12 hours

5. **Expand Test Coverage**
   - [ ] Add tests for organization-scoped tables
   - [ ] Add tests for public tables
   - [ ] Add tests for analytics tables
   - **Estimate:** 20 hours

6. **Performance Review**
   - [ ] Identify slow RLS policies
   - [ ] Add indexes where needed
   - [ ] Optimize complex policies
   - **Estimate:** 8 hours

### Month 2-3 (Medium Term)

7. **Complete RLS Coverage**
   - [ ] Verify ALL tables have RLS
   - [ ] Add missing policies
   - [ ] Test all policies
   - **Estimate:** 40 hours

8. **Security Audit**
   - [ ] External security review
   - [ ] Penetration testing
   - [ ] Compliance verification
   - **Estimate:** External contractor

---

## Risk Assessment

| Finding | Severity | Likelihood | Impact | Risk Level |
|---------|----------|------------|--------|------------|
| Recursion Bugs | High | Medium | High | 🔴 HIGH |
| Missing Tests | High | High | High | 🔴 HIGH |
| Inconsistent Admin | Medium | Low | Medium | 🟡 MEDIUM |
| Order Security | Medium | Low | High | 🟡 MEDIUM |
| Promo Code Security | Medium | Medium | High | 🟡 MEDIUM |
| User Roles Security | High | Low | Critical | 🔴 HIGH |
| Session Security | Low | Low | Low | ✅ RESOLVED |

---

## Success Metrics

### Week 1 Goals

- [ ] Zero recursion bugs in production
- [ ] 6 critical tables have automated tests
- [ ] All critical table RLS verified manually

### Month 1 Goals

- [ ] 80% RLS test coverage
- [ ] All admin bypass patterns standardized
- [ ] CI/CD blocks insecure migrations

### Month 3 Goals

- [ ] 100% RLS coverage
- [ ] External security audit completed
- [ ] Zero security findings in production

---

## Conclusion

The Force Majeure database has **good RLS coverage** but needs:

1. **Systematic testing** - Prevent regressions
2. **Recursion fixes** - Fix systemic issue with helper functions
3. **Standardization** - Consistent patterns across all tables

**Priority:** Focus on Week 1 actions first (recursion fixes + critical table tests).

**Owner:** Security team + Backend team

**Review Date:** 2026-02-01 (check progress on Week 1 goals)

---

## Related Documentation

- [RLS_AUDIT_REPORT.md](./RLS_AUDIT_REPORT.md) - Full audit report
- [RLS_TEST_SUITE.md](./RLS_TEST_SUITE.md) - Test framework
- [RLS_COMPLIANCE_CHECKLIST.md](./RLS_COMPLIANCE_CHECKLIST.md) - Policy checklist
- [PERMISSION_ARCHITECTURE.md](./PERMISSION_ARCHITECTURE.md) - Security model
