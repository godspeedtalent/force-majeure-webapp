-- ============================================
-- FIX ACTIVITY_LOGS TABLE GRANTS
-- ============================================
-- Problem: The activity_logs table has RLS policies but no GRANTs for the
-- authenticated role, resulting in 403 Forbidden errors.
--
-- Solution: Add GRANTs for SELECT and INSERT operations.
-- - SELECT: Admins/developers need to view logs (RLS already restricts access)
-- - INSERT: The log_activity() function is SECURITY DEFINER so it can insert,
--           but we also need authenticated users to be able to call RPC functions
--           that may need to insert logs.
-- ============================================

-- Grant SELECT to authenticated (RLS will restrict to admin/developer only)
GRANT SELECT ON activity_logs TO authenticated;

-- Grant INSERT to authenticated (the RLS policy allows all inserts via WITH CHECK (true))
-- This enables the application to insert activity logs
GRANT INSERT ON activity_logs TO authenticated;

-- Also grant on archive table for admin viewing
GRANT SELECT ON activity_logs_archive TO authenticated;

-- Grant EXECUTE on the log_activity function to authenticated users
-- This allows the application to call the function directly
GRANT EXECUTE ON FUNCTION log_activity TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE activity_logs IS 'Audit log of all administrative actions. GRANTs allow authenticated access, RLS restricts SELECT to admin/developer only.';
