-- ============================================================================
-- Migration: Cleanup Roles System
-- ============================================================================
-- This migration cleans up the role system by:
-- 1. Removing the legacy 'role' enum column from user_roles table
-- 2. Fixing get_user_roles function to return permission_names instead of permissions
-- 3. Adding seed data for default roles
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Step 1: Remove legacy role column from user_roles
-- ----------------------------------------------------------------------------
-- The 'role' column (app_role enum) is no longer used
-- All role management now goes through the roles table via role_id FK
ALTER TABLE user_roles DROP COLUMN IF EXISTS role;

-- ----------------------------------------------------------------------------
-- Step 2: Update get_user_roles function to match frontend expectations
-- ----------------------------------------------------------------------------
-- Frontend expects 'permission_names' as TEXT[], not 'permissions' as JSONB
-- Must DROP first because we're changing the return type
DROP FUNCTION IF EXISTS get_user_roles(UUID);

CREATE FUNCTION get_user_roles(user_id_param UUID)
RETURNS TABLE (
  role_name TEXT,
  display_name TEXT,
  permission_names TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.name::TEXT as role_name,
    r.display_name::TEXT,
    -- Convert JSONB array to TEXT array
    ARRAY(SELECT jsonb_array_elements_text(r.permissions))::TEXT[] as permission_names
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
