-- ============================================================================
-- Simplify events RLS policies to match ticket_tiers
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins and event managers can insert events" ON events;
DROP POLICY IF EXISTS "Admins and event managers can update events" ON events;
DROP POLICY IF EXISTS "Admins and event managers can delete events" ON events;

-- ----------------------------------------------------------------------------
-- INSERT POLICIES
-- ----------------------------------------------------------------------------

-- Policy 1: Admin/Dev access
CREATE POLICY "Admins and devs can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      is_dev_admin(auth.uid())
    )
  );

-- Policy 2: Organization member access
CREATE POLICY "Org members with manage_events can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    has_permission(auth.uid(), 'manage_events') AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.organization_id = events.organization_id
    )
  );

-- ----------------------------------------------------------------------------
-- UPDATE POLICIES
-- ----------------------------------------------------------------------------

-- Policy 1: Admin/Dev access
CREATE POLICY "Admins and devs can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      is_dev_admin(auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      is_dev_admin(auth.uid())
    )
  );

-- Policy 2: Organization member access
CREATE POLICY "Org members with manage_events can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    has_permission(auth.uid(), 'manage_events') AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.organization_id = events.organization_id
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    has_permission(auth.uid(), 'manage_events') AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.organization_id = events.organization_id
    )
  );

-- ----------------------------------------------------------------------------
-- DELETE POLICIES
-- ----------------------------------------------------------------------------

-- Policy 1: Admin/Dev access
CREATE POLICY "Admins and devs can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      is_dev_admin(auth.uid())
    )
  );

-- Policy 2: Organization member access
CREATE POLICY "Org members with manage_events can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    has_permission(auth.uid(), 'manage_events') AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.organization_id = events.organization_id
    )
  );
