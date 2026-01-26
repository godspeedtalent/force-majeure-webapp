-- ============================================================================
-- RLS Policy Optimization - Phase 6: Comprehensive Cleanup
-- ============================================================================
--
-- Optimizes ALL remaining RLS policies with unoptimized auth function calls.
-- This phase covers tables created in January 2026 that were missed in Phase 5.
--
-- Tables in this phase:
-- - organization_staff (13 policies)
-- - tags (5 policies)
-- - submission_tags (2 policies)
-- - user_ignored_submissions (3 policies)
-- - screening_reviews (7 policies)
-- - screening_sample_sets (7 policies)
-- - error_logs (2 policies)
-- - error_logs_archive (1 policy)
-- - process_items (3 policies)
-- - undercard_requests (4 policies)
--
-- Total: 47 policies
--
-- Performance Impact:
-- Sequential scan: O(n) - scans entire table
-- Index scan: O(log n) - uses B-tree indexes
-- Expected improvement: 10-100x faster on user-specific queries
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: organization_staff (13 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Org staff can view staff list" ON organization_staff;
CREATE POLICY "Org staff can view staff list"
  ON organization_staff FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT os.organization_id FROM organization_staff os WHERE os.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Org owners can view staff" ON organization_staff;
CREATE POLICY "Org owners can view staff"
  ON organization_staff FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can view all org staff" ON organization_staff;
CREATE POLICY "Admins can view all org staff"
  ON organization_staff FOR SELECT
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Org owners can manage staff" ON organization_staff;
CREATE POLICY "Org owners can manage staff"
  ON organization_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Org owners can update staff" ON organization_staff;
CREATE POLICY "Org owners can update staff"
  ON organization_staff FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Org owners can delete staff" ON organization_staff;
CREATE POLICY "Org owners can delete staff"
  ON organization_staff FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Org admins can manage staff" ON organization_staff;
CREATE POLICY "Org admins can manage staff"
  ON organization_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT os.organization_id FROM organization_staff os
      WHERE os.user_id = (SELECT auth.uid()) AND os.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Org admins can update staff" ON organization_staff;
CREATE POLICY "Org admins can update staff"
  ON organization_staff FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT os.organization_id FROM organization_staff os
      WHERE os.user_id = (SELECT auth.uid()) AND os.role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT os.organization_id FROM organization_staff os
      WHERE os.user_id = (SELECT auth.uid()) AND os.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Org admins can delete staff" ON organization_staff;
CREATE POLICY "Org admins can delete staff"
  ON organization_staff FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT os.organization_id FROM organization_staff os
      WHERE os.user_id = (SELECT auth.uid()) AND os.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System admins can manage all org staff" ON organization_staff;
CREATE POLICY "System admins can manage all org staff"
  ON organization_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "System admins can update all org staff" ON organization_staff;
CREATE POLICY "System admins can update all org staff"
  ON organization_staff FOR UPDATE
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

DROP POLICY IF EXISTS "System admins can delete all org staff" ON organization_staff;
CREATE POLICY "System admins can delete all org staff"
  ON organization_staff FOR DELETE
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- TABLE: tags (5 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and FM staff can create tags" ON tags;
CREATE POLICY "Admins and FM staff can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can view tags they created" ON tags;
CREATE POLICY "Users can view tags they created"
  ON tags FOR SELECT
  USING (
    created_by = (SELECT auth.uid()) OR
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'fm_staff') OR
    has_role((SELECT auth.uid()), 'developer')
  );

DROP POLICY IF EXISTS "Admins and FM staff can update tags" ON tags;
CREATE POLICY "Admins and FM staff can update tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'fm_staff') OR
    has_role((SELECT auth.uid()), 'developer')
  );

DROP POLICY IF EXISTS "Admins and FM staff can delete tags" ON tags;
CREATE POLICY "Admins and FM staff can delete tags"
  ON tags FOR DELETE
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'fm_staff') OR
    has_role((SELECT auth.uid()), 'developer')
  );

-- ----------------------------------------------------------------------------
-- TABLE: submission_tags (3 policies)
-- ----------------------------------------------------------------------------

-- NOTE: "Anyone can view submission tags" doesn't use auth functions - no optimization needed

DROP POLICY IF EXISTS "Staff can tag submissions" ON submission_tags;
CREATE POLICY "Staff can tag submissions"
  ON submission_tags FOR INSERT
  WITH CHECK (
    has_role((SELECT auth.uid()), 'fm_staff') OR
    has_role((SELECT auth.uid()), 'admin') OR
    is_dev_admin((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Staff can remove submission tags" ON submission_tags;
CREATE POLICY "Staff can remove submission tags"
  ON submission_tags FOR DELETE
  USING (
    has_role((SELECT auth.uid()), 'fm_staff') OR
    has_role((SELECT auth.uid()), 'admin') OR
    is_dev_admin((SELECT auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- TABLE: user_ignored_submissions (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own ignored submissions" ON user_ignored_submissions;
CREATE POLICY "Users can view their own ignored submissions"
  ON user_ignored_submissions FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can ignore submissions" ON user_ignored_submissions;
CREATE POLICY "Users can ignore submissions"
  ON user_ignored_submissions FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can unignore their submissions" ON user_ignored_submissions;
CREATE POLICY "Users can unignore their submissions"
  ON user_ignored_submissions FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- ----------------------------------------------------------------------------
-- TABLE: screening_reviews (7 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and developers can view all reviews" ON screening_reviews;
CREATE POLICY "Admins and developers can view all reviews"
  ON screening_reviews FOR SELECT
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

DROP POLICY IF EXISTS "Users can view own reviews" ON screening_reviews;
CREATE POLICY "Users can view own reviews"
  ON screening_reviews FOR SELECT
  TO authenticated
  USING (reviewer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can create reviews" ON screening_reviews;
CREATE POLICY "Admins can create reviews"
  ON screening_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

DROP POLICY IF EXISTS "Users can create own reviews" ON screening_reviews;
CREATE POLICY "Users can create own reviews"
  ON screening_reviews FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can update reviews" ON screening_reviews;
CREATE POLICY "Admins can update reviews"
  ON screening_reviews FOR UPDATE
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

DROP POLICY IF EXISTS "Users can update own reviews" ON screening_reviews;
CREATE POLICY "Users can update own reviews"
  ON screening_reviews FOR UPDATE
  TO authenticated
  USING (reviewer_id = (SELECT auth.uid()))
  WITH CHECK (reviewer_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can delete reviews" ON screening_reviews;
CREATE POLICY "Admins can delete reviews"
  ON screening_reviews FOR DELETE
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

-- ----------------------------------------------------------------------------
-- TABLE: screening_sample_sets (7 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and developers can view all sample sets" ON screening_sample_sets;
CREATE POLICY "Admins and developers can view all sample sets"
  ON screening_sample_sets FOR SELECT
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

DROP POLICY IF EXISTS "Artists can view their sample sets" ON screening_sample_sets;
CREATE POLICY "Artists can view their sample sets"
  ON screening_sample_sets FOR SELECT
  TO authenticated
  USING (
    artist_id IN (
      SELECT id FROM artists WHERE profile_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can create sample sets" ON screening_sample_sets;
CREATE POLICY "Admins can create sample sets"
  ON screening_sample_sets FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

DROP POLICY IF EXISTS "Artists can create own sample sets" ON screening_sample_sets;
CREATE POLICY "Artists can create own sample sets"
  ON screening_sample_sets FOR INSERT
  TO authenticated
  WITH CHECK (
    artist_id IN (
      SELECT id FROM artists WHERE profile_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can update sample sets" ON screening_sample_sets;
CREATE POLICY "Admins can update sample sets"
  ON screening_sample_sets FOR UPDATE
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

DROP POLICY IF EXISTS "Artists can update own sample sets" ON screening_sample_sets;
CREATE POLICY "Artists can update own sample sets"
  ON screening_sample_sets FOR UPDATE
  TO authenticated
  USING (
    artist_id IN (
      SELECT id FROM artists WHERE profile_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    artist_id IN (
      SELECT id FROM artists WHERE profile_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can delete sample sets" ON screening_sample_sets;
CREATE POLICY "Admins can delete sample sets"
  ON screening_sample_sets FOR DELETE
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

-- ----------------------------------------------------------------------------
-- TABLE: error_logs (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view error logs" ON error_logs;
CREATE POLICY "Admins can view error logs"
  ON error_logs FOR SELECT
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

DROP POLICY IF EXISTS "Admins can delete error logs" ON error_logs;
CREATE POLICY "Admins can delete error logs"
  ON error_logs FOR DELETE
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

-- ----------------------------------------------------------------------------
-- TABLE: error_logs_archive (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view archived error logs" ON error_logs_archive;
CREATE POLICY "Admins can view archived error logs"
  ON error_logs_archive FOR SELECT
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

-- ----------------------------------------------------------------------------
-- TABLE: process_items (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view items for own processes" ON process_items;
CREATE POLICY "Users can view items for own processes"
  ON process_items FOR SELECT
  USING (
    process_id IN (
      SELECT id FROM processes WHERE created_by = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can view all process items" ON process_items;
CREATE POLICY "Admins can view all process items"
  ON process_items FOR SELECT
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

DROP POLICY IF EXISTS "Users can manage items for own processes" ON process_items;
CREATE POLICY "Users can manage items for own processes"
  ON process_items FOR ALL
  TO authenticated
  USING (
    process_id IN (
      SELECT id FROM processes WHERE created_by = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    process_id IN (
      SELECT id FROM processes WHERE created_by = (SELECT auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- TABLE: undercard_requests (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and devs can view all undercard requests" ON undercard_requests;
CREATE POLICY "Admins and devs can view all undercard requests"
  ON undercard_requests FOR SELECT
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can view their own undercard requests" ON undercard_requests;
CREATE POLICY "Users can view their own undercard requests"
  ON undercard_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM artist_registrations ar
      WHERE ar.id = undercard_requests.artist_registration_id
      AND ar.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins and devs can update undercard requests" ON undercard_requests;
CREATE POLICY "Admins and devs can update undercard requests"
  ON undercard_requests FOR UPDATE
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

DROP POLICY IF EXISTS "Admins and devs can delete undercard requests" ON undercard_requests;
CREATE POLICY "Admins and devs can delete undercard requests"
  ON undercard_requests FOR DELETE
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

-- ============================================================================
-- End of Phase 6 Migration
-- ============================================================================
--
-- Verification queries to run after migration:
--
-- Verify policy changes:
-- SELECT tablename, COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE tablename IN ('organization_staff', 'tags', 'entity_tags',
--                     'screening_reviews', 'screening_sample_sets',
--                     'error_logs', 'error_logs_archive', 'process_items',
--                     'undercard_requests')
-- GROUP BY tablename
-- ORDER BY tablename;
--
-- ============================================================================
-- CRITICAL: Run the discovery query to find ANY remaining unoptimized policies
-- ============================================================================
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
-- ============================================================================
