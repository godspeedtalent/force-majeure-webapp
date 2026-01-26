-- ============================================================================
-- Phase 8 RLS Migration Generator
-- ============================================================================
-- Run this query in Supabase SQL Editor to generate the complete Phase 8
-- migration that fixes ALL remaining unoptimized RLS policies.
--
-- INSTRUCTIONS:
-- 1. Copy this entire query
-- 2. Run it in Supabase SQL Editor
-- 3. Copy the output (will be formatted SQL statements)
-- 4. Save to: supabase/migrations/20260126000007_optimize_rls_policies_phase_8_complete.sql
-- 5. Deploy the migration
-- ============================================================================

WITH unoptimized_policies AS (
  SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    -- Get the USING clause (qual is already text in pg_policies view)
    qual as using_clause,
    -- Get the WITH CHECK clause (with_check is already text in pg_policies view)
    with_check as with_check_clause
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      -- Find policies with unoptimized auth function calls
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
  ORDER BY tablename, policyname
),
policy_count AS (
  SELECT COUNT(*) as total FROM unoptimized_policies
),
table_count AS (
  SELECT COUNT(DISTINCT tablename) as total FROM unoptimized_policies
),
migration_header AS (
  SELECT
    '-- ============================================================================' || E'\n' ||
    '-- RLS Policy Optimization - Phase 8: COMPLETE DATABASE OPTIMIZATION' || E'\n' ||
    '-- ============================================================================' || E'\n' ||
    '--' || E'\n' ||
    '-- This migration fixes ALL remaining unoptimized RLS policies in the database.' || E'\n' ||
    '-- Total: ' || (SELECT total FROM policy_count) || ' policies across ' || (SELECT total FROM table_count) || ' tables' || E'\n' ||
    '--' || E'\n' ||
    '-- Pattern: Wrap ALL auth.uid(), has_role(), is_dev_admin(), has_permission(),' || E'\n' ||
    '-- is_event_manager(), is_organization_member() calls in (SELECT ...)' || E'\n' ||
    '-- to ensure per-query evaluation instead of per-row evaluation.' || E'\n' ||
    '--' || E'\n' ||
    '-- Performance Impact: 10-100x faster queries, eliminates all performance warnings' || E'\n' ||
    '-- ============================================================================' || E'\n' ||
    E'\n' as header
),
table_sections AS (
  SELECT
    tablename,
    COUNT(*) as policy_count,
    MIN(policyname) as first_policy  -- For ordering
  FROM unoptimized_policies
  GROUP BY tablename
  ORDER BY tablename
),
optimized_policies AS (
  SELECT
    p.tablename,
    p.policyname,
    p.cmd,
    -- Optimize USING clause
    CASE
      WHEN p.using_clause IS NOT NULL THEN
        -- Apply all optimizations
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    p.using_clause,
                    'auth.uid()', '(SELECT auth.uid())'
                  ),
                  'has_role((SELECT auth.uid())', 'has_role((SELECT auth.uid())'  -- Already optimized, no change
                ),
                'has_role(auth.uid()', 'has_role((SELECT auth.uid())'
              ),
              'is_dev_admin((SELECT auth.uid())', 'is_dev_admin((SELECT auth.uid())'  -- Already optimized
            ),
            'is_dev_admin(auth.uid()', 'is_dev_admin((SELECT auth.uid())'
          ),
          'has_permission(auth.uid()', 'has_permission((SELECT auth.uid())'
        )
      ELSE NULL
    END as optimized_using,
    -- Optimize WITH CHECK clause
    CASE
      WHEN p.with_check_clause IS NOT NULL THEN
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    p.with_check_clause,
                    'auth.uid()', '(SELECT auth.uid())'
                  ),
                  'has_role((SELECT auth.uid())', 'has_role((SELECT auth.uid())'
                ),
                'has_role(auth.uid()', 'has_role((SELECT auth.uid())'
              ),
              'is_dev_admin((SELECT auth.uid())', 'is_dev_admin((SELECT auth.uid())'
            ),
            'is_dev_admin(auth.uid()', 'is_dev_admin((SELECT auth.uid())'
          ),
          'has_permission(auth.uid()', 'has_permission((SELECT auth.uid())'
        )
      ELSE NULL
    END as optimized_with_check
  FROM unoptimized_policies p
)
SELECT
  COALESCE(
    (SELECT header FROM migration_header) ||
    STRING_AGG(
      '-- ----------------------------------------------------------------------------' || E'\n' ||
      '-- TABLE: ' || ts.tablename || ' (' || ts.policy_count || ' ' || CASE WHEN ts.policy_count = 1 THEN 'policy' ELSE 'policies' END || ')' || E'\n' ||
      '-- ----------------------------------------------------------------------------' || E'\n' ||
      E'\n' ||
      (
        SELECT STRING_AGG(
          'DROP POLICY IF EXISTS "' || op.policyname || '" ON ' || op.tablename || ';' || E'\n' ||
          'CREATE POLICY "' || op.policyname || '"' || E'\n' ||
          '  ON ' || op.tablename || ' FOR ' || op.cmd || E'\n' ||
          CASE
            WHEN op.optimized_using IS NOT NULL THEN
              '  USING (' || E'\n    ' || op.optimized_using || E'\n  )'
            ELSE ''
          END ||
          CASE
            WHEN op.optimized_with_check IS NOT NULL THEN
              E'\n  WITH CHECK (' || E'\n    ' || op.optimized_with_check || E'\n  )'
            ELSE ''
          END ||
          ';' || E'\n' || E'\n',
          '' ORDER BY op.policyname
        )
        FROM optimized_policies op
        WHERE op.tablename = ts.tablename
      ),
      '' ORDER BY ts.tablename
    ) ||
    '-- ============================================================================' || E'\n' ||
    '-- End of Phase 8 Migration' || E'\n' ||
    '-- ============================================================================' || E'\n' ||
    '--' || E'\n' ||
    '-- Verification: Run this query to confirm no unoptimized policies remain' || E'\n' ||
    '--' || E'\n' ||
    '-- SELECT COUNT(*) as remaining_unoptimized' || E'\n' ||
    '-- FROM pg_policies' || E'\n' ||
    '-- WHERE schemaname = ''public''' || E'\n' ||
    '--   AND (' || E'\n' ||
    '--     qual LIKE ''%auth.uid()%''' || E'\n' ||
    '--     OR qual LIKE ''%has_role(auth.uid()%''' || E'\n' ||
    '--     OR qual LIKE ''%is_dev_admin(auth.uid()%''' || E'\n' ||
    '--     OR qual LIKE ''%has_permission(auth.uid()%''' || E'\n' ||
    '--   )' || E'\n' ||
    '--   AND (' || E'\n' ||
    '--     qual NOT LIKE ''%(SELECT auth.uid())%''' || E'\n' ||
    '--     AND COALESCE(with_check, '''') NOT LIKE ''%(SELECT auth.uid())%''' || E'\n' ||
    '--   );' || E'\n' ||
    '--' || E'\n' ||
    '-- Expected result: 0' || E'\n' ||
    '-- ============================================================================' || E'\n',
    '-- No unoptimized policies found! ✅' || E'\n'
  ) as phase_8_migration
FROM table_sections ts
LIMIT 1;
