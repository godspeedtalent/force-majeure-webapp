-- Standardize RLS policies to use has_role() function for admin bypass consistency
--
-- Problem: Some RLS policies use direct user_roles JOIN queries instead of the
-- has_role() function. This means they don't benefit from the admin bypass logic
-- added to has_role() in migration 20260122214918.
--
-- Solution: Update entity_fee_items policies to use has_role() which includes
-- automatic admin bypass.

-- =====================================================
-- entity_fee_items - Update policies to use has_role()
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "entity_fee_items_insert_policy" ON entity_fee_items;
DROP POLICY IF EXISTS "entity_fee_items_update_policy" ON entity_fee_items;
DROP POLICY IF EXISTS "entity_fee_items_delete_policy" ON entity_fee_items;

-- Recreate INSERT policy using has_role() with admin bypass
CREATE POLICY "entity_fee_items_insert_policy" ON entity_fee_items
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'org_admin')
  );

-- Recreate UPDATE policy using has_role() with admin bypass
CREATE POLICY "entity_fee_items_update_policy" ON entity_fee_items
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'org_admin')
  );

-- Recreate DELETE policy using has_role() with admin bypass
CREATE POLICY "entity_fee_items_delete_policy" ON entity_fee_items
  FOR DELETE USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'org_admin')
  );

-- Note: The SELECT policy already uses (true) which is correct for public reads

-- Add comment documenting the change
COMMENT ON POLICY "entity_fee_items_insert_policy" ON entity_fee_items IS
  'Allow admins and org_admins to insert fee items. Uses has_role() for admin bypass.';
COMMENT ON POLICY "entity_fee_items_update_policy" ON entity_fee_items IS
  'Allow admins and org_admins to update fee items. Uses has_role() for admin bypass.';
COMMENT ON POLICY "entity_fee_items_delete_policy" ON entity_fee_items IS
  'Allow admins and org_admins to delete fee items. Uses has_role() for admin bypass.';

-- =====================================================
-- Add explicit EXECUTE grants for permission helper functions
-- =====================================================
-- These functions are used by RLS policies and Edge Functions.
-- While PostgreSQL grants EXECUTE to PUBLIC by default, we add
-- explicit grants to ensure they're callable by authenticated users.

-- has_role(user_id, role_name) - Check if user has a specific role
GRANT EXECUTE ON FUNCTION has_role(UUID, TEXT) TO authenticated;

-- has_permission(user_id, permission_name) - Check if user has a specific permission
GRANT EXECUTE ON FUNCTION has_permission(UUID, TEXT) TO authenticated;

-- get_user_roles(user_id) - Get all roles for a user
GRANT EXECUTE ON FUNCTION get_user_roles(UUID) TO authenticated;

-- is_dev_admin(user_id) - Check if dev admin mode is active
GRANT EXECUTE ON FUNCTION is_dev_admin(UUID) TO authenticated;

-- Also grant to anon for RLS policies that may check during unauthenticated access
GRANT EXECUTE ON FUNCTION has_role(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION has_permission(UUID, TEXT) TO anon;

COMMENT ON FUNCTION has_role(UUID, TEXT) IS
  'Check if user has a specific role. Includes admin bypass - admins automatically have all roles.';
COMMENT ON FUNCTION has_permission(UUID, TEXT) IS
  'Check if user has a specific permission through their roles. Includes admin bypass.';
COMMENT ON FUNCTION get_user_roles(UUID) IS
  'Get all roles assigned to a user with their permissions.';
COMMENT ON FUNCTION is_dev_admin(UUID) IS
  'Check if dev_admin_access feature flag is enabled for dev environment.';
