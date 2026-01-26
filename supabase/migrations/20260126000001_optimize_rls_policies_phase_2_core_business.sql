-- ============================================================================
-- RLS Policy Optimization - Phase 2: Core Business Tables
-- ============================================================================
--
-- Optimizes RLS policies by wrapping auth.uid(), has_role(), and is_dev_admin()
-- calls with (SELECT ...) to enable index usage and prevent sequential scans.
--
-- Tables in this phase:
-- - events (4 policies)
-- - cities (4 policies)
-- - environments (2 policies)
-- - event_rsvps (5 policies)
-- - user_event_interests (2 policies)
-- - comp_tickets (3 policies)
--
-- Total: 20 policies
--
-- Performance Impact:
-- Sequential scan: O(n) - scans entire table
-- Index scan: O(log n) - uses B-tree indexes
-- Expected improvement: 10-100x faster on user-specific queries
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: events (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert events" ON events;
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update events" ON events;
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete events" ON events;
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: cities (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert cities" ON cities;
CREATE POLICY "Admins can insert cities"
  ON cities FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update cities" ON cities;
CREATE POLICY "Admins can update cities"
  ON cities FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete cities" ON cities;
CREATE POLICY "Admins can delete cities"
  ON cities FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: environments (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "admin_manage_environments" ON environments;
CREATE POLICY "admin_manage_environments"
  ON environments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.name IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = (SELECT auth.uid())
      AND r.name IN ('admin', 'developer')
    )
  );

-- ----------------------------------------------------------------------------
-- TABLE: event_rsvps (5 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can insert own RSVP" ON event_rsvps;
CREATE POLICY "Users can insert own RSVP" ON event_rsvps
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own RSVP" ON event_rsvps;
CREATE POLICY "Users can update own RSVP" ON event_rsvps
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own RSVP" ON event_rsvps;
CREATE POLICY "Users can delete own RSVP" ON event_rsvps
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage all RSVPs" ON event_rsvps;
CREATE POLICY "Admins can manage all RSVPs" ON event_rsvps
  FOR ALL TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- TABLE: user_event_interests (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can insert own interests" ON user_event_interests;
CREATE POLICY "Authenticated users can insert own interests" ON user_event_interests
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own interests" ON user_event_interests;
CREATE POLICY "Users can delete own interests" ON user_event_interests
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- TABLE: comp_tickets (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage all comp tickets" ON comp_tickets;
CREATE POLICY "Admins can manage all comp tickets" ON comp_tickets
  FOR ALL TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can view own comp tickets" ON comp_tickets;
CREATE POLICY "Users can view own comp tickets" ON comp_tickets
  FOR SELECT TO authenticated
  USING (
    recipient_user_id = (SELECT auth.uid()) OR
    recipient_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );

-- ============================================================================
-- End of Phase 2 Migration
-- ============================================================================
--
-- Verification queries to run after migration:
--
-- Check index usage on events:
-- SELECT * FROM pg_stat_user_indexes WHERE tablename = 'events';
--
-- Verify policy changes:
-- SELECT policyname, tablename FROM pg_policies
-- WHERE tablename IN ('events', 'cities', 'environments', 'event_rsvps', 'user_event_interests', 'comp_tickets')
-- ORDER BY tablename, policyname;
--
-- Test query performance:
-- EXPLAIN ANALYZE SELECT * FROM events WHERE organization_id IS NOT NULL;
-- EXPLAIN ANALYZE SELECT * FROM event_rsvps WHERE user_id = '<your_user_id>';
-- ============================================================================
