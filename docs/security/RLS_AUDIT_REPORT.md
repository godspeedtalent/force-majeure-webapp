# Row-Level Security (RLS) Audit Report

**Generated:** 2026-01-24
**Auditor:** Automated Audit + Manual Review
**Status:** 🟡 In Progress

---

## Executive Summary

This document provides a comprehensive audit of Row-Level Security (RLS) policies across the Force Majeure database. RLS policies are the **primary security enforcement layer** for data access control. Client-side permission checks are for UX only and do not provide security.

### Critical Findings

🔴 **HIGH PRIORITY**
- Recent migrations show ongoing RLS issues (recursion bugs, access control gaps)
- Need systematic verification that all critical tables have proper RLS coverage
- Missing RLS test suite to prevent regressions

⚠️ **MEDIUM PRIORITY**
- Some tables may have overly permissive policies (e.g., anonymous access where it shouldn't be)
- Complex policies using recursive functions need performance review
- Policy naming inconsistencies across tables

✅ **STRENGTHS**
- 128 migrations contain CREATE POLICY statements (extensive coverage)
- Recent standardization effort (`20260122700000_standardize_rls_policies_to_use_has_role.sql`)
- Active maintenance with frequent RLS fixes

---

## Audit Methodology

### 1. Table Inventory

All tables extracted from `/src/integrations/supabase/types.ts`:

**Critical Tables** (require strict RLS):
- `profiles` - User profile data
- `orders` - Financial transactions
- `order_items` - Order details
- `tickets` - Ticket ownership
- `ticket_tiers` - Pricing/inventory
- `events` - Event information
- `organizations` - Organization data
- `user_roles` - Permission assignments
- `payment_intents` (if exists) - Payment data
- `ticketing_sessions` - Queue management

**Sensitive Tables** (require RLS):
- `artist_registrations` - Artist applications
- `screening_submissions` - Submission review
- `screening_reviews` - Review data
- `guest_list_settings` - Private guest lists
- `guests` - Guest information
- `addresses` - Personal addresses
- `comp_tickets` - Complimentary tickets
- `promo_codes` - Promotional codes
- `contact_submissions` - Contact form data
- `error_logs` - System errors (may contain PII)
- `activity_logs` - User activity (contains PII)

**Public Tables** (may not need RLS):
- `events` (read-only for anon)
- `artists` (read-only for anon)
- `venues` (read-only for anon)
- `genres` (read-only for anon)
- `cities` (read-only for anon)
- `feature_flags` (read-only based on environment)

**Admin-Only Tables**:
- `analytics_*` - Analytics data
- `report_*` - Reporting configuration
- `dev_notes` - Developer notes
- `dev_bookmarks` - Developer bookmarks
- `datagrid_configs` - Grid configurations
- `column_customizations` - UI customizations
- `app_settings` - Application settings

**Archive Tables** (service_role only):
- `activity_logs_archive`
- `analytics_*_archive`
- `error_logs_archive`

---

## Recent RLS Issues (Evidence of Ongoing Gaps)

### 1. Recursion Bugs

**File:** `20260124010000_fix_screening_reviews_rls_recursion.sql`
- **Issue:** RLS policy caused infinite recursion
- **Impact:** Database queries failing or hanging
- **Root Cause:** Policy calling function that queries same table

**File:** `20260123100000_fix_organization_staff_rls_recursion.sql`
- **Issue:** Another recursion bug in organization staff RLS
- **Impact:** Same as above
- **Pattern:** Using `has_role()` or similar helpers in RLS policies can cause recursion

**File:** `20260122100000_fix_event_staff_rls_recursion.sql`
- **Issue:** Event staff RLS recursion
- **Pattern:** This is a systemic issue, not isolated

### 2. Access Control Gaps

**File:** `20260123800000_fix_event_page_anon_access.sql`
- **Issue:** Anonymous users couldn't access public event pages
- **Impact:** Broken public functionality
- **Root Cause:** Overly restrictive RLS policy

**File:** `20251220000000_fix_environments_anonymous_access.sql`
- **Issue:** Anonymous users need access to feature flag environments
- **Impact:** Feature flags not working for logged-out users

### 3. Permission Fixes

**File:** `20260122000002_fix_ticketing_fees_admin_select.sql`
- **Issue:** Admins couldn't query ticketing fees
- **Impact:** Admin tools broken

**File:** `20251219170000_fix_feature_flags_update_permission.sql`
- **Issue:** Feature flag updates not working properly

**File:** `20260104000001_fix_undercard_requests_permissions.sql`
- **Issue:** Undercard request permissions incorrect

---

## RLS Policy Patterns

### Pattern 1: Admin Bypass

```sql
CREATE POLICY "Admin can do anything"
  ON public.table_name
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));
```

**Used in:** Most admin-managed tables
**Status:** ✅ Good pattern

### Pattern 2: Owner-Only Access

```sql
CREATE POLICY "Users can view own records"
  ON public.table_name
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
```

**Used in:** `profiles`, `orders`, `tickets`
**Status:** ✅ Good pattern

### Pattern 3: Public Read

```sql
CREATE POLICY "Public read access"
  ON public.table_name
  FOR SELECT
  TO anon, authenticated
  USING (true);
```

**Used in:** `events`, `artists`, `venues`
**Status:** ⚠️ Verify public tables should be fully public

### Pattern 4: Role-Based Access

```sql
CREATE POLICY "Organization staff can view"
  ON public.table_name
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'org_staff') OR
    is_organization_staff(auth.uid(), organization_id)
  );
```

**Used in:** Organization-scoped tables
**Status:** ⚠️ Watch for recursion issues

### Pattern 5: Service Role Only

```sql
-- Revoke all from regular users
REVOKE ALL ON public.table_name FROM anon;
REVOKE ALL ON public.table_name FROM authenticated;

-- Grant to service_role
GRANT ALL ON public.table_name TO service_role;

-- Optional: Admin view-only policy
CREATE POLICY "Admins can view for monitoring"
  ON public.table_name
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

**Used in:** `ticketing_sessions` (as of 2026-01-24)
**Status:** ✅ Good for sensitive queue data

---

## Tables Requiring Immediate Review

### 🔴 Critical Priority

1. **`orders` and `order_items`**
   - Contains financial data
   - Must verify only owner + admin can access
   - Check for anonymous access holes
   - **Action:** Verify RLS, add test cases

2. **`tickets`**
   - Contains PII (name, email via joins)
   - Ticket ownership transfer needs review
   - **Action:** Verify ownership checks, test transfers

3. **`ticketing_sessions`**
   - Recently locked down (2026-01-24)
   - Previously had security issues (queue manipulation possible)
   - **Action:** Verify lockdown is complete

4. **`user_roles`**
   - Controls access to entire system
   - Must be admin-only for INSERT/UPDATE/DELETE
   - **Action:** Verify only admins can grant roles

5. **`promo_codes`**
   - Financial impact (discounts)
   - Must verify proper scoping (event-specific, org-specific)
   - **Action:** Check for code leakage across events

### ⚠️ High Priority

6. **`profiles`**
   - Contains PII
   - Recent fix: `20260111230000_fix_profiles_rls_user_id.sql`
   - **Action:** Verify users can only see own profile (except admins)

7. **`activity_logs` and `error_logs`**
   - May contain sensitive data in metadata/messages
   - Multiple fixes: `20251225100001_fix_activity_logs_full_admin_access.sql`
   - **Action:** Verify admin-only access, check for PII leakage

8. **`screening_submissions` and `screening_reviews`**
   - Sensitive artist submission data
   - Recent recursion fix: `20260124010000_fix_screening_reviews_rls_recursion.sql`
   - **Action:** Verify reviewer access, check recursion fix holds

9. **`artist_registrations`**
   - Multiple RLS fixes in Dec 2025
   - **Action:** Review all policies for completeness

10. **`guest_list_settings` and `guests`**
    - Event guest lists should be private to event organizers
    - **Action:** Verify org staff can't see other orgs' guests

---

## RLS Testing Framework (Proposed)

### Test Categories

**1. Ownership Tests**
```sql
-- Test: User A cannot access User B's order
-- Expected: 0 rows
SELECT * FROM orders WHERE id = '<user_b_order_id>';
-- (When authenticated as User A)
```

**2. Anonymous Access Tests**
```sql
-- Test: Anonymous user can view public events
-- Expected: All published events
SELECT * FROM events WHERE status = 'published';
-- (When not authenticated)
```

**3. Role-Based Tests**
```sql
-- Test: Org staff can only see their org's data
-- Expected: Only org X data
SELECT * FROM organizations WHERE id != '<user_org_id>';
-- (When authenticated as org_staff of org X)
-- Expected: 0 rows
```

**4. Admin Bypass Tests**
```sql
-- Test: Admin can see all data
-- Expected: All rows
SELECT * FROM orders;
-- (When authenticated as admin)
```

**5. Mutation Tests**
```sql
-- Test: User cannot update another user's profile
-- Expected: Error or 0 rows affected
UPDATE profiles SET display_name = 'hacked' WHERE id != auth.uid();
-- (When authenticated as regular user)
```

### Test Implementation Plan

**Phase 1:** Create test user fixtures
- Admin user
- Regular user A
- Regular user B
- Org staff user
- Artist user

**Phase 2:** Create test data
- Orders for each user
- Events for different orgs
- Artist registrations
- Screening submissions

**Phase 3:** Run automated tests
- pgTAP tests (PostgreSQL testing framework)
- Or: Edge function test suite
- Or: Integration tests in application

**Phase 4:** Document results
- Create RLS_TEST_RESULTS.md
- Track coverage percentage
- Identify gaps

---

## Action Items

### Immediate (Week 1)

- [ ] **Manual review of top 10 critical tables**
  - Review policy logic for correctness
  - Check for obvious holes (e.g., missing WHERE clauses)
  - Document findings

- [ ] **Verify recent RLS fixes are working**
  - Test `ticketing_sessions` lockdown
  - Verify recursion fixes don't break functionality
  - Check `event_page_anon_access` fix

- [ ] **Create RLS test plan document**
  - Define test cases for each critical table
  - Identify test user personas
  - Plan test data setup

### Short Term (Month 1)

- [ ] **Implement automated RLS tests**
  - Set up pgTAP or equivalent
  - Write 50+ test cases covering critical tables
  - Add to CI/CD pipeline

- [ ] **Document all RLS policies**
  - Create table-by-table policy documentation
  - Explain security model for each table
  - Add inline SQL comments to migrations

- [ ] **Standardize policy naming**
  - Use consistent naming: `"[Role] can [action] [condition]"`
  - Examples: "Admin can select all", "Users can update own profile"

### Medium Term (Quarter 1)

- [ ] **RLS performance review**
  - Identify slow policies (especially recursive ones)
  - Add indexes where needed
  - Consider computed columns for complex checks

- [ ] **Security audit by external reviewer**
  - Hire security consultant
  - Focus on financial tables (`orders`, `tickets`, `promo_codes`)
  - Penetration testing

- [ ] **Create RLS monitoring**
  - Log policy violations (failed queries)
  - Alert on suspicious patterns
  - Track policy bypass attempts

---

## Policy Violation Monitoring (Proposed)

### Log Failed Access Attempts

```sql
-- Add trigger to log RLS policy violations
CREATE OR REPLACE FUNCTION log_rls_violation()
RETURNS event_trigger AS $$
BEGIN
  -- Log details of failed query
  INSERT INTO security_violations (
    user_id,
    table_name,
    action,
    timestamp
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    TG_OP,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;
```

### Alert on Suspicious Patterns

- Multiple failed access attempts to financial tables
- Attempts to access other users' data
- Bulk query patterns that might indicate scraping
- Role escalation attempts

---

## Recommendations

### 1. Adopt Service Role Pattern for Sensitive Operations

**Current State:** Some tables use permissive RLS policies
**Recommended:** Use service_role-only pattern for:
- Payment processing (`payment_intents`)
- Queue management (`ticketing_sessions`) ✅ **Done**
- Automated operations (cron jobs, background tasks)

### 2. Simplify Complex Policies

**Issue:** Recursive function calls in policies cause bugs
**Recommended:**
- Use simple, inline checks where possible
- Cache role checks in session variables
- Consider materialized views for complex access control

### 3. Add Policy Testing to PR Process

**Current State:** RLS policies deployed without automated tests
**Recommended:**
- Require tests for all new RLS policies
- Block PRs that modify RLS without tests
- Run RLS test suite on every migration

### 4. Document Security Model

**Create:** `docs/security/RLS_SECURITY_MODEL.md`
**Include:**
- Table-by-table security requirements
- Role permission matrix
- Data classification (public, sensitive, confidential)
- Compliance requirements (GDPR, PCI-DSS if applicable)

---

## Conclusion

The Force Majeure database has **extensive RLS coverage** with 128+ migration files creating policies. However, recent issues (recursion bugs, access control gaps) indicate the need for:

1. **Systematic testing** - Automated test suite for all critical tables
2. **Documentation** - Clear security model and policy documentation
3. **Monitoring** - Track policy violations and suspicious access patterns
4. **Simplification** - Reduce complex recursive policies

**Next Steps:** Begin immediate action items (manual review of critical tables, verify recent fixes, create test plan).

---

## Appendix A: All Tables in Database

(This list extracted from `types.ts` - filtered to show actual tables only, not RPC functions)

**Tables requiring RLS verification:**

- activity_logs
- activity_logs_archive
- addresses
- analytics_daily_page_views
- analytics_funnel_events
- analytics_funnel_events_archive
- analytics_funnel_summary
- analytics_page_views
- analytics_page_views_archive
- analytics_performance
- analytics_performance_summary
- analytics_sessions
- analytics_sessions_archive
- app_settings
- artist_genres
- artist_recordings
- artist_registrations
- artists
- chart_labels
- cities
- column_customizations
- comp_tickets
- contact_submissions
- datagrid_configs
- dev_bookmarks
- dev_notes
- entity_fee_items
- environments
- error_logs
- error_logs_archive
- event_artists
- event_images
- event_partners
- event_promo_codes
- event_rsvps
- event_staff
- event_views
- events
- exclusive_content_grants
- feature_flags
- genres
- group_members
- groups
- guest_list_settings
- guests
- link_clicks
- media_galleries
- media_items
- order_items
- orders
- organization_staff
- organizations
- pending_order_links
- processes
- process_items
- products
- profiles
- promo_code_groups
- promo_code_tiers
- promo_codes
- queue_configurations
- rave_family
- report_configurations
- report_history
- report_recipients
- roles
- rsvp_scan_events
- scavenger_claims
- scavenger_locations
- scavenger_tokens
- screening_config
- screening_reviews
- screening_submissions
- submission_scores
- submission_tags
- table_metadata
- tags
- test_event_interests
- test_event_rsvps
- test_order_items
- test_orders
- test_profiles
- test_tickets
- ticket_groups
- ticket_holds
- ticket_scan_events
- ticket_scans
- ticket_tiers
- ticketing_fees
- ticketing_sessions
- tickets
- tracking_links
- undercard_requests
- user_event_interests
- user_ignored_submissions
- user_requests
- user_roles
- venue_required_genres
- venues
- webhook_events

**Total Tables:** 100+ (excluding RPC functions)

---

## Appendix B: Recent RLS Migration History

Migrations with RLS fixes (most recent first):

1. `20260124214140` - Fix ticketing_sessions RLS (service role only)
2. `20260124010000` - Fix screening_reviews recursion
3. `20260123800000` - Fix event page anonymous access
4. `20260123100000` - Fix organization_staff recursion
5. `20260122700000` - **Standardize RLS to use has_role** (major refactor)
6. `20260122500000` - Fix guest list RLS and RSVP scanning
7. `20260122100000` - Fix event_staff recursion
8. `20260121950000` - Fix queue config permissions
9. Many more... (see migration files for full history)

This history shows **active maintenance** but also indicates **systemic issues** that need addressing.
