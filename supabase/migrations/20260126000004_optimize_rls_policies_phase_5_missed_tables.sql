-- ============================================================================
-- RLS Policy Optimization - Phase 5: Missed Tables
-- ============================================================================
--
-- Optimizes RLS policies for tables created after the initial 4-phase
-- optimization. These tables were added in January 2026 and have unoptimized
-- auth.uid(), has_role(), and is_dev_admin() calls.
--
-- Tables in this phase:
-- - event_promo_codes (1 policy)
-- - event_staff (7 policies)
-- - event_partners (3 policies)
-- - chart_labels (3 policies)
-- - contact_submissions (1 policy)
-- - dev_bookmarks (3 policies)
-- - guests (3 policies)
-- - addresses (2 policies)
-- - processes (2 policies)
--
-- Total: 25 policies (initial batch - more may be needed)
--
-- Performance Impact:
-- Sequential scan: O(n) - scans entire table
-- Index scan: O(log n) - uses B-tree indexes
-- Expected improvement: 10-100x faster on user-specific queries
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: event_promo_codes (2 policies)
-- ----------------------------------------------------------------------------

-- NOTE: "Public can view event promo codes" doesn't use auth functions - no optimization needed

-- Admins/developers can manage all event promo codes
DROP POLICY IF EXISTS "Admins can manage event promo codes" ON event_promo_codes;
CREATE POLICY "Admins can manage event promo codes"
  ON event_promo_codes FOR ALL
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- TABLE: event_staff (8 policies)
-- ----------------------------------------------------------------------------

-- Users can view their own staff assignments (direct user assignment)
DROP POLICY IF EXISTS "Users can view their staff assignments" ON event_staff;
CREATE POLICY "Users can view their staff assignments"
  ON event_staff FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Organization owners can view staff assignments for their orgs
DROP POLICY IF EXISTS "Org owners can view their org staff assignments" ON event_staff;
CREATE POLICY "Org owners can view their org staff assignments"
  ON event_staff FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())
    )
  );

-- Admins/developers can view all staff assignments
DROP POLICY IF EXISTS "Admins can view all staff assignments" ON event_staff;
CREATE POLICY "Admins can view all staff assignments"
  ON event_staff FOR SELECT
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

-- Admins/developers can manage all staff assignments
DROP POLICY IF EXISTS "Admins can manage staff assignments" ON event_staff;
CREATE POLICY "Admins can manage staff assignments"
  ON event_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can update staff assignments" ON event_staff;
CREATE POLICY "Admins can update staff assignments"
  ON event_staff FOR UPDATE
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can delete staff assignments" ON event_staff;
CREATE POLICY "Admins can delete staff assignments"
  ON event_staff FOR DELETE
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

-- Event managers can manage staff for their events
DROP POLICY IF EXISTS "Event managers can manage their event staff" ON event_staff;
CREATE POLICY "Event managers can manage their event staff"
  ON event_staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_staff es
      WHERE es.event_id = event_staff.event_id
        AND es.user_id = (SELECT auth.uid())
        AND es.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_staff es
      WHERE es.event_id = event_staff.event_id
        AND es.user_id = (SELECT auth.uid())
        AND es.role = 'manager'
    )
  );

-- ----------------------------------------------------------------------------
-- TABLE: event_partners (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "event_partners_insert_policy" ON event_partners;
CREATE POLICY "event_partners_insert_policy"
  ON event_partners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.name IN ('admin', 'developer')
    )
  );

DROP POLICY IF EXISTS "event_partners_update_policy" ON event_partners;
CREATE POLICY "event_partners_update_policy"
  ON event_partners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.name IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.name IN ('admin', 'developer')
    )
  );

DROP POLICY IF EXISTS "event_partners_delete_policy" ON event_partners;
CREATE POLICY "event_partners_delete_policy"
  ON event_partners FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.name IN ('admin', 'developer')
    )
  );

-- ----------------------------------------------------------------------------
-- TABLE: chart_labels (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own labels" ON chart_labels;
CREATE POLICY "Users can view own labels"
  ON chart_labels FOR SELECT
  USING ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Admins can view all labels" ON chart_labels;
CREATE POLICY "Admins can view all labels"
  ON chart_labels FOR SELECT
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

DROP POLICY IF EXISTS "Users can manage own labels" ON chart_labels;
CREATE POLICY "Users can manage own labels"
  ON chart_labels FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = created_by)
  WITH CHECK ((SELECT auth.uid()) = created_by);

-- ----------------------------------------------------------------------------
-- TABLE: contact_submissions (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Only admins can view contact submissions" ON contact_submissions;
CREATE POLICY "Only admins can view contact submissions"
  ON contact_submissions FOR ALL
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- TABLE: dev_bookmarks (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Developers can view bookmarks" ON dev_bookmarks;
CREATE POLICY "Developers can view bookmarks"
  ON dev_bookmarks FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Developers can insert bookmarks" ON dev_bookmarks;
CREATE POLICY "Developers can insert bookmarks"
  ON dev_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (
    ((SELECT auth.uid()) = user_id) AND
    (has_role((SELECT auth.uid()), 'developer') OR has_role((SELECT auth.uid()), 'admin'))
  );

DROP POLICY IF EXISTS "Developers can manage own bookmarks" ON dev_bookmarks;
CREATE POLICY "Developers can manage own bookmarks"
  ON dev_bookmarks FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- TABLE: guests (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Guests are publicly readable" ON guests;
-- NOTE: This policy doesn't use auth functions - no optimization needed

DROP POLICY IF EXISTS "Admins can manage guests" ON guests;
CREATE POLICY "Admins can manage guests"
  ON guests FOR ALL
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- TABLE: addresses (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can manage their own addresses" ON addresses;
CREATE POLICY "Users can manage their own addresses"
  ON addresses FOR ALL
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view linked guest addresses" ON addresses;
CREATE POLICY "Users can view linked guest addresses"
  ON addresses FOR SELECT
  USING (
    guest_id IN (
      SELECT id FROM guests WHERE profile_id = (SELECT auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- TABLE: processes (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own processes" ON processes;
CREATE POLICY "Users can view own processes"
  ON processes FOR SELECT
  USING ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Admins can view all processes" ON processes;
CREATE POLICY "Admins can view all processes"
  ON processes FOR SELECT
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

-- ============================================================================
-- End of Phase 5 Migration
-- ============================================================================
--
-- Verification queries to run after migration:
--
-- Verify policy changes:
-- SELECT policyname, tablename FROM pg_policies
-- WHERE tablename IN ('event_promo_codes', 'event_staff', 'event_partners',
--                     'chart_labels', 'contact_submissions', 'dev_bookmarks',
--                     'guests', 'addresses', 'processes')
-- ORDER BY tablename, policyname;
--
-- Test query performance:
-- EXPLAIN ANALYZE SELECT * FROM event_staff WHERE user_id = '<your_user_id>';
-- EXPLAIN ANALYZE SELECT * FROM addresses WHERE profile_id = '<your_user_id>';
--
-- ============================================================================
-- IMPORTANT: Find ALL remaining unoptimized policies
-- ============================================================================
--
-- Run this query in Supabase to find any remaining policies that need optimization:
--
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) as using_clause
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (
--     pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%auth.uid()%'
--     OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%auth.jwt()%'
--     OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%has_role(auth%'
--     OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%is_dev_admin(auth%'
--   )
--   AND pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) NOT LIKE '%(SELECT auth.uid())%'
--   AND pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) NOT LIKE '%(SELECT auth.jwt())%'
-- ORDER BY tablename, policyname;
--
-- This query will show ALL policies that still call auth functions per-row instead of per-query.
-- ============================================================================
