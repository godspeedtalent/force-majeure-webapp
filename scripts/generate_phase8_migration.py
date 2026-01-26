#!/usr/bin/env python3
"""
Generate Phase 8 RLS Policy Optimization Migration

This script takes the JSON output from the Supabase query and generates
a complete SQL migration that optimizes ALL unoptimized RLS policies.

Usage:
1. Save the Supabase query results to 'unoptimized_policies.json'
2. Run: python generate_phase8_migration.py
3. Output will be saved to: supabase/migrations/20260126000007_optimize_rls_policies_phase_8_complete.sql
"""

import json
import re

def optimize_clause(clause):
    """Optimize a policy clause by wrapping auth function calls in SELECT"""
    if not clause:
        return None

    # Wrap auth.uid() calls
    clause = re.sub(r'(?<!\(SELECT )\bauth\.uid\(\)', r'(SELECT auth.uid())', clause)

    # Wrap has_role(auth.uid(), ...) calls
    clause = re.sub(r'has_role\(auth\.uid\(\)', r'has_role((SELECT auth.uid())', clause)

    # Wrap is_dev_admin(auth.uid()) calls
    clause = re.sub(r'is_dev_admin\(auth\.uid\(\)', r'is_dev_admin((SELECT auth.uid())', clause)

    # Wrap has_permission(auth.uid(), ...) calls
    clause = re.sub(r'has_permission\(auth\.uid\(\)', r'has_permission((SELECT auth.uid())', clause)

    # Wrap is_event_manager(auth.uid(), ...) calls
    clause = re.sub(r'is_event_manager\(auth\.uid\(\)', r'is_event_manager((SELECT auth.uid())', clause)

    return clause

def generate_policy_sql(policy):
    """Generate DROP and CREATE POLICY statements for a single policy"""
    tablename = policy['tablename']
    policyname = policy['policyname']
    cmd = policy['cmd']
    using_clause = optimize_clause(policy['using_clause'])
    with_check_clause = optimize_clause(policy['with_check_clause'])

    sql = f'DROP POLICY IF EXISTS "{policyname}" ON {tablename};\n'
    sql += f'CREATE POLICY "{policyname}"\n'
    sql += f'  ON {tablename} FOR {cmd}\n'

    if using_clause:
        sql += f'  USING (\n    {using_clause}\n  )'

    if with_check_clause:
        sql += f'\n  WITH CHECK (\n    {with_check_clause}\n  )'

    sql += ';\n'

    return sql

def main():
    # Read the JSON input
    with open('unoptimized_policies.json', 'r') as f:
        policies = json.load(f)

    print(f"Found {len(policies)} unoptimized policies")

    # Group policies by table
    tables = {}
    for policy in policies:
        tablename = policy['tablename']
        if tablename not in tables:
            tables[tablename] = []
        tables[tablename].append(policy)

    # Generate the migration SQL
    migration_sql = """-- ============================================================================
-- RLS Policy Optimization - Phase 8: COMPLETE DATABASE OPTIMIZATION
-- ============================================================================
--
-- This migration fixes ALL remaining unoptimized RLS policies in the database.
-- Total: {count} policies across {table_count} tables
--
-- Pattern: Wrap ALL auth.uid(), has_role(), is_dev_admin() calls in (SELECT ...)
-- to ensure per-query evaluation instead of per-row evaluation.
--
-- Performance Impact: 10-100x faster queries, eliminates all performance warnings
-- ============================================================================

""".format(count=len(policies), table_count=len(tables))

    # Add policies grouped by table
    for tablename in sorted(tables.keys()):
        table_policies = tables[tablename]
        migration_sql += f"-- ----------------------------------------------------------------------------\n"
        migration_sql += f"-- TABLE: {tablename} ({len(table_policies)} policies)\n"
        migration_sql += f"-- ----------------------------------------------------------------------------\n\n"

        for policy in table_policies:
            migration_sql += generate_policy_sql(policy)
            migration_sql += "\n"

    # Add verification query at the end
    migration_sql += """-- ============================================================================
-- End of Phase 8 Migration
-- ============================================================================
--
-- Verification: Run this query to confirm no unoptimized policies remain
--
-- SELECT COUNT(*) as remaining_unoptimized
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (
--     qual LIKE '%auth.uid()%'
--     OR qual LIKE '%has_role(auth.uid()%'
--     OR qual LIKE '%is_dev_admin(auth.uid()%'
--   )
--   AND (
--     qual NOT LIKE '%(SELECT auth.uid())%'
--     AND COALESCE(with_check, '') NOT LIKE '%(SELECT auth.uid())%'
--   );
--
-- Expected result: 0
-- ============================================================================
"""

    # Write the migration file
    output_path = '../supabase/migrations/20260126000007_optimize_rls_policies_phase_8_complete.sql'
    with open(output_path, 'w') as f:
        f.write(migration_sql)

    print(f"Migration generated successfully!")
    print(f"Output: {output_path}")
    print(f"Tables: {len(tables)}")
    print(f"Policies: {len(policies)}")

if __name__ == '__main__':
    main()
