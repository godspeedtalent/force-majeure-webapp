-- ============================================================================
-- Simplify ticket_tiers RLS policies to fix admin access
-- ============================================================================
--
-- Problem: Admin role check might not be short-circuiting properly in the
-- complex OR conditions, causing permission denied even for admins
--
-- Solution: Separate admin/dev access into its own simple policy
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins and event managers can insert ticket tiers" ON ticket_tiers;
DROP POLICY IF EXISTS "Admins and event managers can update ticket tiers" ON ticket_tiers;
DROP POLICY IF EXISTS "Admins and event managers can delete ticket tiers" ON ticket_tiers;

-- ----------------------------------------------------------------------------
-- INSERT POLICIES (Two separate policies for clarity)
-- ----------------------------------------------------------------------------

-- Policy 1: Admin/Dev access (simple, no joins needed)
CREATE POLICY "Admins and devs can insert ticket tiers"
  ON ticket_tiers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      is_dev_admin(auth.uid())
    )
  );

-- Policy 2: Organization member access (with org check)
CREATE POLICY "Org members with manage_events can insert ticket tiers"
  ON ticket_tiers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    has_permission(auth.uid(), 'manage_events') AND
    EXISTS (
      SELECT 1 FROM events e
      INNER JOIN profiles p ON p.organization_id = e.organization_id
      WHERE e.id = ticket_tiers.event_id
      AND p.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- UPDATE POLICIES
-- ----------------------------------------------------------------------------

-- Policy 1: Admin/Dev access
CREATE POLICY "Admins and devs can update ticket tiers"
  ON ticket_tiers FOR UPDATE
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
CREATE POLICY "Org members with manage_events can update ticket tiers"
  ON ticket_tiers FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    has_permission(auth.uid(), 'manage_events') AND
    EXISTS (
      SELECT 1 FROM events e
      INNER JOIN profiles p ON p.organization_id = e.organization_id
      WHERE e.id = ticket_tiers.event_id
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    has_permission(auth.uid(), 'manage_events') AND
    EXISTS (
      SELECT 1 FROM events e
      INNER JOIN profiles p ON p.organization_id = e.organization_id
      WHERE e.id = ticket_tiers.event_id
      AND p.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- DELETE POLICIES
-- ----------------------------------------------------------------------------

-- Policy 1: Admin/Dev access
CREATE POLICY "Admins and devs can delete ticket tiers"
  ON ticket_tiers FOR DELETE
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
CREATE POLICY "Org members with manage_events can delete ticket tiers"
  ON ticket_tiers FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    has_permission(auth.uid(), 'manage_events') AND
    EXISTS (
      SELECT 1 FROM events e
      INNER JOIN profiles p ON p.organization_id = e.organization_id
      WHERE e.id = ticket_tiers.event_id
      AND p.user_id = auth.uid()
    )
  );
