-- ============================================================================
-- RLS RECURSION HOTFIX
-- ============================================================================
-- This migration fixes infinite recursion issues in RLS policies for:
-- - organization_staff
-- - event_staff
-- - queue_configurations
--
-- The issue was caused by policies that query the same table they're defined on,
-- creating infinite recursion when PostgreSQL evaluates the policies.
--
-- Solution: Use SECURITY DEFINER helper functions that bypass RLS:
-- - get_user_organization_ids() for organization_staff
-- - is_event_manager() for event_staff
-- - is_organization_admin() for organization admin checks
-- ============================================================================

-- ============================================================================
-- ORGANIZATION_STAFF: Drop ALL old policies and create non-recursive ones
-- ============================================================================

-- Drop all existing policies on organization_staff
DROP POLICY IF EXISTS "Admins can view all org staff" ON organization_staff;
DROP POLICY IF EXISTS "Org admins can delete staff" ON organization_staff;
DROP POLICY IF EXISTS "Org admins can update staff" ON organization_staff;
DROP POLICY IF EXISTS "Org owners can delete staff" ON organization_staff;
DROP POLICY IF EXISTS "Org owners can update staff" ON organization_staff;
DROP POLICY IF EXISTS "Org owners can view staff" ON organization_staff;
DROP POLICY IF EXISTS "Org staff can view staff list" ON organization_staff;
DROP POLICY IF EXISTS "System admins can delete all org staff" ON organization_staff;
DROP POLICY IF EXISTS "System admins can update all org staff" ON organization_staff;
DROP POLICY IF EXISTS "organization_staff_select_policy" ON organization_staff;
DROP POLICY IF EXISTS "organization_staff_insert_policy" ON organization_staff;
DROP POLICY IF EXISTS "organization_staff_update_policy" ON organization_staff;
DROP POLICY IF EXISTS "organization_staff_delete_policy" ON organization_staff;

-- SELECT: Uses get_user_organization_ids() SECURITY DEFINER function to avoid recursion
CREATE POLICY "organization_staff_select_policy"
  ON organization_staff FOR SELECT
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    organization_id = ANY(get_user_organization_ids((SELECT auth.uid())))
  );

-- INSERT: Uses is_organization_admin() SECURITY DEFINER function to avoid recursion
CREATE POLICY "organization_staff_insert_policy"
  ON organization_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_organization_admin((SELECT auth.uid()), organization_id)
  );

-- UPDATE: Uses is_organization_admin() SECURITY DEFINER function to avoid recursion
CREATE POLICY "organization_staff_update_policy"
  ON organization_staff FOR UPDATE
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_organization_admin((SELECT auth.uid()), organization_id)
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_organization_admin((SELECT auth.uid()), organization_id)
  );

-- DELETE: Uses is_organization_admin() SECURITY DEFINER function to avoid recursion
CREATE POLICY "organization_staff_delete_policy"
  ON organization_staff FOR DELETE
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_organization_admin((SELECT auth.uid()), organization_id)
  );

-- ============================================================================
-- EVENT_STAFF: Drop ALL old policies and create non-recursive ones
-- ============================================================================

-- Drop all existing policies on event_staff
DROP POLICY IF EXISTS "Admins can delete staff assignments" ON event_staff;
DROP POLICY IF EXISTS "Admins can update staff assignments" ON event_staff;
DROP POLICY IF EXISTS "Admins can view all staff assignments" ON event_staff;
DROP POLICY IF EXISTS "Event managers can manage their event staff" ON event_staff;
DROP POLICY IF EXISTS "Org owners can view their org staff assignments" ON event_staff;
DROP POLICY IF EXISTS "Users can view their staff assignments" ON event_staff;
DROP POLICY IF EXISTS "event_staff_select_policy" ON event_staff;
DROP POLICY IF EXISTS "event_staff_insert_policy" ON event_staff;
DROP POLICY IF EXISTS "event_staff_update_policy" ON event_staff;
DROP POLICY IF EXISTS "event_staff_delete_policy" ON event_staff;

-- SELECT: Admins, event managers (via SECURITY DEFINER), org owners, and own assignments
CREATE POLICY "event_staff_select_policy"
  ON event_staff FOR SELECT
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    user_id = (SELECT auth.uid()) OR
    is_event_manager((SELECT auth.uid()), event_id) OR
    organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid()))
  );

-- INSERT: Admins and event managers only
CREATE POLICY "event_staff_insert_policy"
  ON event_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_event_manager((SELECT auth.uid()), event_id)
  );

-- UPDATE: Admins and event managers only
CREATE POLICY "event_staff_update_policy"
  ON event_staff FOR UPDATE
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_event_manager((SELECT auth.uid()), event_id)
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_event_manager((SELECT auth.uid()), event_id)
  );

-- DELETE: Admins and event managers only
CREATE POLICY "event_staff_delete_policy"
  ON event_staff FOR DELETE
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_event_manager((SELECT auth.uid()), event_id)
  );

-- ============================================================================
-- QUEUE_CONFIGURATIONS: Drop ALL old policies and create non-recursive ones
-- ============================================================================

-- Drop all existing policies on queue_configurations
DROP POLICY IF EXISTS "Admins can delete queue configurations" ON queue_configurations;
DROP POLICY IF EXISTS "Admins can manage queue configurations" ON queue_configurations;
DROP POLICY IF EXISTS "Admins can update queue configurations" ON queue_configurations;
DROP POLICY IF EXISTS "Event managers can manage queue configurations" ON queue_configurations;

-- Admin policy
CREATE POLICY "Admins can manage queue configurations"
  ON queue_configurations FOR ALL
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid()))
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid()))
  );

-- Event managers and org owners policy (uses is_event_manager SECURITY DEFINER function)
CREATE POLICY "Event managers can manage queue configurations"
  ON queue_configurations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = queue_configurations.event_id
      AND (
        EXISTS (SELECT 1 FROM organizations o WHERE o.id = e.organization_id AND o.owner_id = (SELECT auth.uid()))
        OR is_event_manager((SELECT auth.uid()), e.id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = queue_configurations.event_id
      AND (
        EXISTS (SELECT 1 FROM organizations o WHERE o.id = e.organization_id AND o.owner_id = (SELECT auth.uid()))
        OR is_event_manager((SELECT auth.uid()), e.id)
      )
    )
  );

-- ============================================================================
-- VERIFICATION: Add comments documenting the fix
-- ============================================================================

COMMENT ON POLICY "organization_staff_select_policy" ON organization_staff IS
  'Non-recursive SELECT policy using get_user_organization_ids() SECURITY DEFINER function';

COMMENT ON POLICY "event_staff_select_policy" ON event_staff IS
  'Non-recursive SELECT policy using is_event_manager() SECURITY DEFINER function';

COMMENT ON POLICY "Event managers can manage queue configurations" ON queue_configurations IS
  'Non-recursive policy using is_event_manager() SECURITY DEFINER function';
