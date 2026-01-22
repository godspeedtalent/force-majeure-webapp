-- ============================================================================
-- Add Admin Bypass to RLS Helper Functions
-- ============================================================================
-- Created: 2026-01-22
-- Purpose: Ensure admin role bypasses all RLS checks by updating helper functions
--
-- Changes:
-- 1. Update has_role() to return true for admins regardless of requested role
-- 2. Update is_event_manager() to return true for admins
-- 3. Ensure consistent admin bypass behavior across all RLS policies
-- ============================================================================

-- ============================================================================
-- Update has_role() to include admin bypass
-- ============================================================================
-- Admins should be considered to have ALL roles automatically
CREATE OR REPLACE FUNCTION has_role(user_id_param UUID, role_name_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Admin bypass: Admins automatically have all roles
  IF EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id_param
    AND r.name = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Normal role check
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id_param
    AND r.name = role_name_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Update is_event_manager() to include admin bypass
-- ============================================================================
-- Admins should be considered event managers for ALL events
CREATE OR REPLACE FUNCTION is_event_manager(p_user_id UUID, p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Admin bypass: Admins are managers for all events
  IF has_role(p_user_id, 'admin') THEN
    RETURN TRUE;
  END IF;

  -- Normal event manager check
  RETURN EXISTS (
    SELECT 1 FROM event_staff
    WHERE event_id = p_event_id
      AND role = 'manager'
      AND (
        user_id = p_user_id OR
        organization_id IN (
          SELECT id FROM organizations WHERE owner_id = p_user_id
        )
      )
  );
END;
$$;

-- ============================================================================
-- Note: has_permission() already checks for wildcard '*' permission,
-- so admin users (who have '*') automatically bypass all permission checks.
-- No changes needed to has_permission().
-- ============================================================================

COMMENT ON FUNCTION has_role(UUID, TEXT) IS 'Checks if user has a specific role. Admins automatically have all roles.';
COMMENT ON FUNCTION is_event_manager(UUID, UUID) IS 'Checks if user is an event manager. Admins are managers for all events.';
