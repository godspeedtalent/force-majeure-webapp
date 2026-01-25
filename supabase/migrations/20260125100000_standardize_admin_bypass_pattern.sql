-- ============================================================================
-- Standardize Admin Bypass Pattern
-- ============================================================================
-- Created: 2026-01-25
-- Purpose: Create a single, consistent function for admin/developer bypass
--          that can be used across all RLS policies.
--
-- Background:
-- - has_role(uid, 'admin') already returns TRUE for admins for ANY role check
-- - is_dev_admin() was checking a feature flag, NOT the actual developer role
-- - Policies were inconsistent: some used 2 checks, some used 3
--
-- Solution:
-- 1. Create is_admin_or_developer() as THE standard admin bypass function
-- 2. Fix is_dev_admin() to properly check the developer role
-- 3. Document the standard pattern for new policies
-- ============================================================================

-- ============================================================================
-- Create the standard admin bypass function
-- ============================================================================
-- This should be used in all RLS policies that need admin/developer bypass.
-- It's more readable and ensures consistent behavior.

CREATE OR REPLACE FUNCTION is_admin_or_developer(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- NULL check
  IF user_id_param IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check for admin or developer role
  -- Note: has_role already has admin bypass built in, so has_role(uid, 'admin')
  -- returns TRUE for admins for any role. But we explicitly check both for clarity.
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id_param
    AND r.name IN ('admin', 'developer')
  );
END;
$$;

COMMENT ON FUNCTION is_admin_or_developer(UUID) IS
'Standard admin bypass function for RLS policies. Returns TRUE if user has admin or developer role.
Use this in all RLS policies that need admin/developer bypass for consistency.

Example usage in RLS policy:
  USING (
    is_admin_or_developer(auth.uid()) OR
    <normal user conditions>
  )';

-- ============================================================================
-- Fix is_dev_admin() to actually check the developer role
-- ============================================================================
-- The old is_dev_admin() was checking a feature flag, which was:
-- 1. Not user-specific (granted access to ALL users when flag enabled)
-- 2. Confusingly named (suggests "dev admin" but checked feature flags)
--
-- New behavior: Check if user has the 'developer' role (same as admin but for dev)

CREATE OR REPLACE FUNCTION is_dev_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- NULL check
  IF user_id_param IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check for admin or developer role
  -- This makes is_dev_admin() equivalent to is_admin_or_developer()
  -- for backwards compatibility with existing policies
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id_param
    AND r.name IN ('admin', 'developer')
  );
END;
$$;

COMMENT ON FUNCTION is_dev_admin(UUID) IS
'DEPRECATED: Use is_admin_or_developer() instead.
Now checks for admin or developer role (previously checked feature flags).
Kept for backwards compatibility with existing policies.';

-- ============================================================================
-- Update is_organization_admin() to include admin bypass
-- ============================================================================
-- Ensure admins can manage all organizations
-- Note: Must use p_organization_id (not p_org_id) to match existing function signature

CREATE OR REPLACE FUNCTION is_organization_admin(p_user_id UUID, p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- NULL check
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Admin bypass: Site admins are org admins for all organizations
  IF is_admin_or_developer(p_user_id) THEN
    RETURN TRUE;
  END IF;

  -- Check if user is owner (owners are always admins)
  IF EXISTS (
    SELECT 1 FROM organizations WHERE id = p_organization_id AND owner_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check if user has admin role in org_staff table
  RETURN EXISTS (
    SELECT 1 FROM organization_staff
    WHERE organization_id = p_organization_id
      AND user_id = p_user_id
      AND role = 'admin'
  );
END;
$$;

COMMENT ON FUNCTION is_organization_admin(UUID, UUID) IS
'Checks if user is an organization admin. Site admins/developers are admins for all organizations.';

-- ============================================================================
-- Update is_event_staff() to include admin bypass
-- ============================================================================
-- Ensure admins are considered staff for all events

CREATE OR REPLACE FUNCTION is_event_staff(p_user_id UUID, p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- NULL check
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Admin bypass: Admins are staff for all events
  IF is_admin_or_developer(p_user_id) THEN
    RETURN TRUE;
  END IF;

  -- Normal event staff check
  RETURN EXISTS (
    SELECT 1 FROM event_staff
    WHERE event_id = p_event_id
      AND (
        user_id = p_user_id OR
        organization_id IN (
          SELECT id FROM organizations WHERE owner_id = p_user_id
        )
      )
  );
END;
$$;

COMMENT ON FUNCTION is_event_staff(UUID, UUID) IS
'Checks if user is event staff. Site admins/developers are staff for all events.';

-- ============================================================================
-- Documentation: Standard RLS Policy Pattern
-- ============================================================================
--
-- RECOMMENDED PATTERN for new RLS policies:
--
-- CREATE POLICY "policy_name"
--   ON table_name FOR operation
--   TO authenticated
--   USING (
--     is_admin_or_developer(auth.uid()) OR
--     <normal user conditions>
--   );
--
-- LEGACY PATTERN (still works, but use new pattern for new policies):
--
-- CREATE POLICY "policy_name"
--   ON table_name FOR operation
--   TO authenticated
--   USING (
--     has_role(auth.uid(), 'admin') OR
--     is_dev_admin(auth.uid()) OR
--     <normal user conditions>
--   );
--
-- Note: Both patterns are now equivalent because:
-- 1. is_admin_or_developer() checks admin OR developer role
-- 2. is_dev_admin() now also checks admin OR developer role
-- 3. has_role('admin') returns true for admins (with built-in bypass)
--
-- ============================================================================
