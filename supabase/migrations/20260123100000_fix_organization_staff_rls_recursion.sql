-- ============================================================================
-- FIX ORGANIZATION_STAFF RLS INFINITE RECURSION
-- ============================================================================
-- The original RLS policies query organization_staff within themselves,
-- causing infinite recursion when PostgreSQL evaluates the policies.
--
-- Solution: Use SECURITY DEFINER helper functions that bypass RLS.
-- ============================================================================

-- First, ensure the helper function exists and uses SECURITY DEFINER
-- This version doesn't trigger RLS because it runs as the function owner
CREATE OR REPLACE FUNCTION get_user_organization_ids(p_user_id UUID)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_ids UUID[];
BEGIN
  -- Get organizations where user is staff (bypasses RLS due to SECURITY DEFINER)
  SELECT ARRAY_AGG(DISTINCT org_id)
  INTO v_org_ids
  FROM (
    -- Organizations where user is staff member
    SELECT organization_id as org_id
    FROM organization_staff
    WHERE user_id = p_user_id
    UNION
    -- Organizations where user is owner
    SELECT id as org_id
    FROM organizations
    WHERE owner_id = p_user_id
  ) combined;

  RETURN COALESCE(v_org_ids, ARRAY[]::UUID[]);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_organization_ids(UUID) TO authenticated;

-- ============================================================================
-- DROP ALL EXISTING POLICIES ON organization_staff
-- ============================================================================

DROP POLICY IF EXISTS "Org staff can view staff list" ON organization_staff;
DROP POLICY IF EXISTS "Org owners can view staff" ON organization_staff;
DROP POLICY IF EXISTS "Admins can view all org staff" ON organization_staff;
DROP POLICY IF EXISTS "Org owners can manage staff" ON organization_staff;
DROP POLICY IF EXISTS "Org owners can update staff" ON organization_staff;
DROP POLICY IF EXISTS "Org owners can delete staff" ON organization_staff;
DROP POLICY IF EXISTS "Org admins can manage staff" ON organization_staff;
DROP POLICY IF EXISTS "Org admins can update staff" ON organization_staff;
DROP POLICY IF EXISTS "Org admins can delete staff" ON organization_staff;
DROP POLICY IF EXISTS "System admins can manage all org staff" ON organization_staff;
DROP POLICY IF EXISTS "System admins can update all org staff" ON organization_staff;
DROP POLICY IF EXISTS "System admins can delete all org staff" ON organization_staff;

-- ============================================================================
-- CREATE NEW NON-RECURSIVE POLICIES
-- ============================================================================

-- SELECT: Users can view staff of orgs they belong to (using SECURITY DEFINER function)
CREATE POLICY "organization_staff_select_policy"
  ON organization_staff FOR SELECT
  TO authenticated
  USING (
    -- Admins/developers can view all
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid()) OR
    -- User is a member of this organization (checked via SECURITY DEFINER function)
    organization_id = ANY(get_user_organization_ids(auth.uid()))
  );

-- INSERT: Org owners and org admins can add staff
CREATE POLICY "organization_staff_insert_policy"
  ON organization_staff FOR INSERT
  TO authenticated
  WITH CHECK (
    -- System admins can insert anywhere
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid()) OR
    -- Org owner can add staff
    is_organization_admin(auth.uid(), organization_id)
  );

-- UPDATE: Org owners and org admins can update staff
CREATE POLICY "organization_staff_update_policy"
  ON organization_staff FOR UPDATE
  TO authenticated
  USING (
    -- System admins can update anywhere
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid()) OR
    -- Org admin can update their org's staff
    is_organization_admin(auth.uid(), organization_id)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid()) OR
    is_organization_admin(auth.uid(), organization_id)
  );

-- DELETE: Org owners and org admins can remove staff
CREATE POLICY "organization_staff_delete_policy"
  ON organization_staff FOR DELETE
  TO authenticated
  USING (
    -- System admins can delete anywhere
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid()) OR
    -- Org admin can delete their org's staff
    is_organization_admin(auth.uid(), organization_id)
  );

-- ============================================================================
-- ADD COMMENT
-- ============================================================================

COMMENT ON FUNCTION get_user_organization_ids IS
  'Returns array of organization IDs where the user is staff or owner. Uses SECURITY DEFINER to bypass RLS and avoid infinite recursion.';
