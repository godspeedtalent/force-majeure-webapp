-- ============================================
-- FIX ACTIVITY_LOGS - FULL ADMIN CRUD ACCESS
-- ============================================
-- Problem: Admins still getting 403 errors when accessing activity logs.
-- Previous migration only added SELECT/INSERT grants.
--
-- Solution: Add full CRUD GRANTs and update RLS policies for admin access.
-- ============================================

-- ============================================
-- SECTION 1: GRANTS
-- ============================================

-- Grant full CRUD to authenticated (RLS will restrict to admin/developer only)
GRANT SELECT, INSERT, UPDATE, DELETE ON activity_logs TO authenticated;

-- Also grant full access on archive table for admin operations
GRANT SELECT, INSERT, UPDATE, DELETE ON activity_logs_archive TO authenticated;

-- ============================================
-- SECTION 2: UPDATE RLS POLICIES
-- ============================================

-- Drop existing policies to recreate with proper admin access
DROP POLICY IF EXISTS "Admins can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Service role can insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Admins can view archived logs" ON activity_logs_archive;

-- Admins/developers can do ALL operations on activity_logs
CREATE POLICY "Admins have full access to activity logs"
  ON activity_logs FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Allow any authenticated user to INSERT logs (for logging their own actions)
-- This is needed for the log_activity RPC to work from client-side
CREATE POLICY "Authenticated users can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins/developers have full access to archived logs
CREATE POLICY "Admins have full access to archived logs"
  ON activity_logs_archive FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE activity_logs IS 'Audit log of all administrative actions. Admins/developers have full CRUD access.';
