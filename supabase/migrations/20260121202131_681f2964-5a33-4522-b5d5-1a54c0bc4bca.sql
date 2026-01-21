-- ============================================
-- FIX ACTIVITY_LOGS INSERT PERMISSIONS
-- ============================================
-- Problem: Any authenticated user can directly INSERT into activity_logs,
-- enabling log poisoning attacks.
--
-- Solution: Remove permissive INSERT policy. The log_activity() function
-- is SECURITY DEFINER so it will still work for legitimate logging.
-- Only admins/developers and the log_activity function can insert.
-- ============================================

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON activity_logs;

-- Create a more restrictive INSERT policy - only admins/developers can insert directly
-- The log_activity() SECURITY DEFINER function bypasses RLS, so it will still work
CREATE POLICY "Only admins can insert activity logs directly"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Revoke direct INSERT from authenticated (log_activity function handles this)
-- Keep SELECT for the function to work, admins have full access via their policy
REVOKE INSERT ON activity_logs FROM authenticated;
GRANT INSERT ON activity_logs TO service_role;

-- Ensure the log_activity function has proper permissions
-- It's SECURITY DEFINER so it executes as the function owner (postgres)
GRANT EXECUTE ON FUNCTION log_activity TO authenticated, anon, service_role;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON POLICY "Only admins can insert activity logs directly" ON activity_logs 
  IS 'Direct inserts restricted to admins. Normal logging uses log_activity() SECURITY DEFINER function.';