/**
 * Generate Phase 8 RLS Policy Optimization Migration
 *
 * This script:
 * 1. Connects to Supabase and queries pg_policies for unoptimized policies
 * 2. Generates optimized DROP/CREATE POLICY statements
 * 3. Writes the complete Phase 8 migration file
 *
 * Usage: npx tsx scripts/generate-phase8-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Simple .env file loader
function loadEnv() {
  // Try .env.local first, then .env
  const envFiles = ['.env.local', '.env'];

  for (const envFile of envFiles) {
    try {
      const envPath = path.join(process.cwd(), envFile);
      const envContent = fs.readFileSync(envPath, 'utf-8');

      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            process.env[key.trim()] = value.trim();
          }
        }
      });

      // If we successfully loaded this file, we're done
      return;
    } catch (error) {
      // Try next file
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error('');
  console.error('Please ensure your .env file contains:');
  console.error('  VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...');
  console.error('');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

interface Policy {
  schemaname: string;
  tablename: string;
  policyname: string;
  cmd: string;
  using_clause: string | null;
  with_check_clause: string | null;
}

/**
 * Optimize a policy clause by wrapping auth function calls in SELECT
 */
function optimizeClause(clause: string | null): string | null {
  if (!clause) return null;

  let optimized = clause;

  // Wrap standalone auth.uid() calls that aren't already in SELECT
  optimized = optimized.replace(/(?<!\(SELECT\s+)auth\.uid\(\)(?!\s+AS)/g, '(SELECT auth.uid())');

  // Wrap has_role(auth.uid(), ...) calls
  optimized = optimized.replace(/has_role\(\s*auth\.uid\(\)/g, 'has_role((SELECT auth.uid())');

  // Wrap is_dev_admin(auth.uid()) calls
  optimized = optimized.replace(/is_dev_admin\(\s*auth\.uid\(\)/g, 'is_dev_admin((SELECT auth.uid())');

  // Wrap has_permission(auth.uid(), ...) calls
  optimized = optimized.replace(/has_permission\(\s*auth\.uid\(\)/g, 'has_permission((SELECT auth.uid())');

  // Wrap is_event_manager(auth.uid(), ...) calls
  optimized = optimized.replace(/is_event_manager\(\s*auth\.uid\(\)/g, 'is_event_manager((SELECT auth.uid())');

  // Wrap is_organization_member(auth.uid(), ...) calls
  optimized = optimized.replace(/is_organization_member\(\s*auth\.uid\(\)/g, 'is_organization_member((SELECT auth.uid())');

  return optimized;
}

/**
 * Generate SQL for a single policy
 */
function generatePolicySQL(policy: Policy): string {
  const { tablename, policyname, cmd, using_clause, with_check_clause } = policy;

  const optimizedUsing = optimizeClause(using_clause);
  const optimizedWithCheck = optimizeClause(with_check_clause);

  let sql = `DROP POLICY IF EXISTS "${policyname}" ON ${tablename};\n`;
  sql += `CREATE POLICY "${policyname}"\n`;
  sql += `  ON ${tablename} FOR ${cmd}\n`;

  if (optimizedUsing) {
    sql += `  USING (\n    ${optimizedUsing}\n  )`;
  }

  if (optimizedWithCheck) {
    sql += `\n  WITH CHECK (\n    ${optimizedWithCheck}\n  )`;
  }

  sql += ';\n';

  return sql;
}

/**
 * Query Supabase for unoptimized policies
 */
async function getUnoptimizedPolicies(): Promise<Policy[]> {
  console.log('🔍 Querying for unoptimized RLS policies...\n');

  // Check if JSON file exists as fallback
  const jsonPath = path.join(process.cwd(), 'scripts', 'unoptimized_policies.json');
  if (fs.existsSync(jsonPath)) {
    console.log('📁 Found unoptimized_policies.json, using cached data\n');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    return JSON.parse(jsonData) as Policy[];
  }

  console.log('📁 No JSON file found, querying database directly...\n');
  console.log('');
  console.log('⚠️  IMPORTANT: If this script fails, please:');
  console.log('  1. Run the query from scripts/find_unoptimized_policies.sql in Supabase SQL Editor');
  console.log('  2. Copy the JSON results');
  console.log('  3. Save to scripts/unoptimized_policies.json');
  console.log('  4. Run this script again');
  console.log('');

  // Try to query directly (this requires exec_sql RPC function or similar)
  // If not available, user will need to use the manual approach above
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
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
      `
    });

    if (error) {
      console.error('❌ Error querying policies (exec_sql RPC may not exist)');
      console.error('');
      console.error('Please manually run the query:');
      console.error('  1. Open Supabase SQL Editor');
      console.error('  2. Run the query from scripts/find_unoptimized_policies.sql');
      console.error('  3. Save results to scripts/unoptimized_policies.json');
      console.error('  4. Run this script again');
      console.error('');
      throw error;
    }

    return data as Policy[];
  } catch (err) {
    console.error('');
    console.error('Unable to query database directly. Please use manual approach:');
    console.error('  1. Run scripts/find_unoptimized_policies.sql in Supabase');
    console.error('  2. Save JSON to scripts/unoptimized_policies.json');
    console.error('  3. Re-run this script');
    throw err;
  }
}

/**
 * Generate the complete Phase 8 migration file
 */
async function generateMigration() {
  try {
    const policies = await getUnoptimizedPolicies();

    if (!policies || policies.length === 0) {
      console.log('✅ No unoptimized policies found! All policies are already optimized.');
      return;
    }

    console.log(`📊 Found ${policies.length} unoptimized policies\n`);

    // Group policies by table
    const policiesByTable = policies.reduce((acc, policy) => {
      if (!acc[policy.tablename]) {
        acc[policy.tablename] = [];
      }
      acc[policy.tablename].push(policy);
      return acc;
    }, {} as Record<string, Policy[]>);

    const tableCount = Object.keys(policiesByTable).length;
    console.log(`📋 Across ${tableCount} tables\n`);

    // Generate migration header
    let migrationSQL = `-- ============================================================================
-- RLS Policy Optimization - Phase 8: COMPLETE DATABASE OPTIMIZATION
-- ============================================================================
--
-- This migration fixes ALL remaining unoptimized RLS policies in the database.
-- Total: ${policies.length} policies across ${tableCount} tables
--
-- Pattern: Wrap ALL auth.uid(), has_role(), is_dev_admin(), has_permission(),
-- is_event_manager(), is_organization_member() calls in (SELECT ...)
-- to ensure per-query evaluation instead of per-row evaluation.
--
-- Performance Impact: 10-100x faster queries, eliminates all performance warnings
-- ============================================================================

`;

    // Add policies grouped by table
    const sortedTables = Object.keys(policiesByTable).sort();
    for (const tablename of sortedTables) {
      const tablePolicies = policiesByTable[tablename];
      migrationSQL += `-- ----------------------------------------------------------------------------\n`;
      migrationSQL += `-- TABLE: ${tablename} (${tablePolicies.length} ${tablePolicies.length === 1 ? 'policy' : 'policies'})\n`;
      migrationSQL += `-- ----------------------------------------------------------------------------\n\n`;

      for (const policy of tablePolicies) {
        migrationSQL += generatePolicySQL(policy);
        migrationSQL += '\n';
      }
    }

    // Add verification query
    migrationSQL += `-- ============================================================================
-- End of Phase 8 Migration
-- ============================================================================
--
-- Verification: Run this query to confirm no unoptimized policies remain
--
-- SELECT COUNT(*) as remaining_unoptimized
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (
--     pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%auth.uid()%'
--     OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%has_role(auth.uid()%'
--     OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%is_dev_admin(auth.uid()%'
--     OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%has_permission(auth.uid()%'
--     OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%is_event_manager(auth.uid()%'
--     OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%is_organization_member(auth.uid()%'
--   )
--   AND (
--     pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) NOT LIKE '%(SELECT auth.uid())%'
--     AND COALESCE(pg_get_expr(with_check, (schemaname || '.' || tablename)::regclass), '') NOT LIKE '%(SELECT auth.uid())%'
--   );
--
-- Expected result: 0
-- ============================================================================
`;

    // Write migration file
    const outputPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20260126000007_optimize_rls_policies_phase_8_complete.sql'
    );

    fs.writeFileSync(outputPath, migrationSQL, 'utf-8');

    console.log('✅ Migration generated successfully!\n');
    console.log(`📄 Output: ${outputPath}`);
    console.log(`📊 Tables: ${tableCount}`);
    console.log(`📋 Policies: ${policies.length}`);
    console.log('');
    console.log('Next steps:');
    console.log('  1. Review the migration file');
    console.log('  2. Commit the changes');
    console.log('  3. Deploy to Supabase');
    console.log('  4. Run verification query');
    console.log('');

  } catch (error) {
    console.error('❌ Error generating migration:', error);
    process.exit(1);
  }
}

// Run the migration generator
generateMigration();
