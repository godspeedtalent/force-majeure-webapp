-- ============================================================================
-- RLS Policy Optimization Generator
-- ============================================================================
-- Run this query in Supabase SQL Editor to generate a complete migration
-- that optimizes ALL unoptimized RLS policies in your database.
--
-- This will output SQL statements that you can save as a new migration file.
-- ============================================================================

WITH unoptimized_policies AS (
  SELECT
    schemaname,
    tablename,
    policyname,
    -- Get the USING clause
    pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) as using_clause,
    -- Get the WITH CHECK clause
    pg_get_expr(with_check, (schemaname || '.' || tablename)::regclass) as with_check_clause,
    -- Get the command type (SELECT, INSERT, UPDATE, DELETE, ALL)
    cmd,
    -- Get the roles
    CASE
      WHEN roles = '{public}' THEN 'public'
      WHEN roles = '{authenticated}' THEN 'authenticated'
      WHEN roles = '{anon}' THEN 'anon'
      ELSE 'authenticated'
    END as role_target
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      -- Find policies with unoptimized auth function calls
      pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%auth.uid()%'
      OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%has_role(auth%'
      OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%is_dev_admin(auth%'
      OR pg_get_expr(with_check, (schemaname || '.' || tablename)::regclass) LIKE '%auth.uid()%'
      OR pg_get_expr(with_check, (schemaname || '.' || tablename)::regclass) LIKE '%has_role(auth%'
      OR pg_get_expr(with_check, (schemaname || '.' || tablename)::regclass) LIKE '%is_dev_admin(auth%'
    )
    AND (
      -- Exclude already optimized (wrapped in SELECT)
      pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) NOT LIKE '%(SELECT auth.uid())%'
      AND COALESCE(pg_get_expr(with_check, (schemaname || '.' || tablename)::regclass), '') NOT LIKE '%(SELECT auth.uid())%'
    )
  ORDER BY tablename, policyname
)
SELECT
  '-- Table: ' || tablename || E'\n' ||
  'DROP POLICY IF EXISTS "' || policyname || '" ON ' || tablename || ';' || E'\n' ||
  'CREATE POLICY "' || policyname || '" ON ' || tablename || E'\n' ||
  '  FOR ' || cmd ||
  CASE WHEN role_target != 'public' THEN ' TO ' || role_target ELSE '' END || E'\n' ||
  CASE
    WHEN using_clause IS NOT NULL THEN
      '  USING (' || E'\n    ' ||
      -- Optimize the USING clause
      REPLACE(
        REPLACE(
          REPLACE(using_clause, 'auth.uid()', '(SELECT auth.uid())'),
          'has_role(auth.uid()', 'has_role((SELECT auth.uid())'
        ),
        'is_dev_admin(auth.uid()', 'is_dev_admin((SELECT auth.uid())'
      ) || E'\n  )'
    ELSE ''
  END ||
  CASE
    WHEN with_check_clause IS NOT NULL THEN
      E'\n  WITH CHECK (' || E'\n    ' ||
      -- Optimize the WITH CHECK clause
      REPLACE(
        REPLACE(
          REPLACE(with_check_clause, 'auth.uid()', '(SELECT auth.uid())'),
          'has_role(auth.uid()', 'has_role((SELECT auth.uid())'
        ),
        'is_dev_admin(auth.uid()', 'is_dev_admin((SELECT auth.uid())'
      ) || E'\n  )'
    ELSE ''
  END || ';' || E'\n'
  as migration_sql
FROM unoptimized_policies;
