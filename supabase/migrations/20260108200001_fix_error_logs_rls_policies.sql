-- Migration: Fix error_logs RLS policies
-- Description: Fix is_dev_admin() calls to include auth.uid() parameter
-- Issue: The is_dev_admin function requires a user_id parameter but was called without one
-- Note: Only runs if error_logs table exists (created by 20251228200000_create_error_logs_table.sql)

-- Only proceed if the table exists
DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'error_logs') THEN
    -- ============================================
    -- Fix error_logs SELECT policy
    -- ============================================
    DROP POLICY IF EXISTS "Admins can view error logs" ON public.error_logs;

    CREATE POLICY "Admins can view error logs"
    ON public.error_logs FOR SELECT
    USING (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      is_dev_admin(auth.uid())
    );

    -- ============================================
    -- Fix error_logs DELETE policy
    -- ============================================
    DROP POLICY IF EXISTS "Admins can delete error logs" ON public.error_logs;

    CREATE POLICY "Admins can delete error logs"
    ON public.error_logs FOR DELETE
    USING (
      has_role(auth.uid(), 'admin') OR
      is_dev_admin(auth.uid())
    );

    RAISE NOTICE 'Fixed error_logs RLS policies';
  ELSE
    RAISE NOTICE 'error_logs table does not exist, skipping RLS policy fix';
  END IF;
END $$;

-- Add comments documenting the fix (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'error_logs') THEN
    COMMENT ON POLICY "Admins can view error logs" ON public.error_logs IS
      'Allows admin, developer roles, or dev_admins to view error logs. Fixed 2026-01-08 to pass auth.uid() to is_dev_admin().';

    COMMENT ON POLICY "Admins can delete error logs" ON public.error_logs IS
      'Allows admin roles or dev_admins to delete error logs for cleanup. Fixed 2026-01-08 to pass auth.uid() to is_dev_admin().';
  END IF;
END $$;
