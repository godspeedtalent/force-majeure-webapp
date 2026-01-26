-- ============================================================================
-- Find ALL Unoptimized RLS Policies
-- ============================================================================
-- Run this in Supabase SQL Editor to find all policies that need optimization
-- Returns results as JSON that can be used with the Python generator
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    -- Find unoptimized auth.uid() calls
    qual LIKE '%auth.uid()%'
    OR qual LIKE '%has_role(auth.uid()%'
    OR qual LIKE '%is_dev_admin(auth.uid()%'
    OR qual LIKE '%has_permission(auth.uid()%'
    OR qual LIKE '%is_event_manager(auth.uid()%'
    OR qual LIKE '%is_organization_member(auth.uid()%'
    OR COALESCE(with_check, '') LIKE '%auth.uid()%'
    OR COALESCE(with_check, '') LIKE '%has_role(auth.uid()%'
    OR COALESCE(with_check, '') LIKE '%is_dev_admin(auth.uid()%'
    OR COALESCE(with_check, '') LIKE '%has_permission(auth.uid()%'
    OR COALESCE(with_check, '') LIKE '%is_event_manager(auth.uid()%'
    OR COALESCE(with_check, '') LIKE '%is_organization_member(auth.uid()%'
  )
  AND (
    -- Exclude already optimized (wrapped in SELECT)
    qual NOT LIKE '%(SELECT auth.uid())%'
    AND COALESCE(with_check, '') NOT LIKE '%(SELECT auth.uid())%'
  )
ORDER BY tablename, policyname;
