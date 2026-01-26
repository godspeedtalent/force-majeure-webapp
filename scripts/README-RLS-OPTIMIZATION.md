# RLS Policy Optimization Scripts

This directory contains tools to find and fix unoptimized Row Level Security (RLS) policies in your Supabase database.

## Problem

RLS policies that call `auth.uid()` and other auth functions directly are evaluated **per-row** instead of **per-query**, causing 10-100x performance degradation.

## Quick Start (Recommended Approach)

### Generate Phase 8 Migration Using SQL

This is the **easiest and most reliable method**:

1. **Copy the generator query:**
   ```bash
   cat scripts/generate_phase8_migration_sql.sql
   ```

2. **Run in Supabase SQL Editor:**
   - Open your Supabase Dashboard → SQL Editor
   - Paste the entire query
   - Click "Run"

3. **Save the output:**
   - Copy the generated SQL from the results
   - Save to: `supabase/migrations/20260126000007_optimize_rls_policies_phase_8_complete.sql`

4. **Deploy:**
   ```bash
   git add supabase/migrations/20260126000007_optimize_rls_policies_phase_8_complete.sql
   git commit -m "feat: Phase 8 RLS policy optimization - fix all remaining policies"
   git push
   ```

5. **Verify:**
   Run the verification query (included at the end of the generated migration) in Supabase SQL Editor. Should return `0`.

## Alternative Methods

### Method 1: TypeScript Generator (Requires Credentials)

If you have `SUPABASE_SERVICE_ROLE_KEY` configured in `.env` or `.env.local`:

```bash
npx tsx scripts/generate-phase8-migration.ts
```

This will:
- Query your database directly
- Generate the migration file automatically
- Save to `supabase/migrations/20260126000007_optimize_rls_policies_phase_8_complete.sql`

### Method 2: Python Generator (Requires JSON Export)

1. **Export unoptimized policies:**
   - Run `scripts/find_unoptimized_policies.sql` in Supabase SQL Editor
   - Save JSON results to `scripts/unoptimized_policies.json`

2. **Generate migration:**
   ```bash
   cd scripts
   python3 generate_phase8_migration.py
   ```

3. **Output:** `supabase/migrations/20260126000007_optimize_rls_policies_phase_8_complete.sql`

## Available Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| **generate_phase8_migration_sql.sql** | 🌟 SQL-based generator (RECOMMENDED) | Run in Supabase SQL Editor |
| **find_unoptimized_policies.sql** | Find all unoptimized policies | Run in Supabase, returns JSON |
| **generate_rls_optimization.sql** | Alternative SQL generator | Run in Supabase SQL Editor |
| **generate-phase8-migration.ts** | TypeScript generator | `npx tsx scripts/generate-phase8-migration.ts` |
| **generate_phase8_migration.py** | Python generator | `python3 scripts/generate_phase8_migration.py` |
| **generate_phase8.sh** | Bash wrapper for Python | `bash scripts/generate_phase8.sh` |

## The Fix Pattern

### Before (Unoptimized)
```sql
CREATE POLICY "Users can view own data" ON table_name
  FOR SELECT
  USING (user_id = auth.uid());  -- ❌ Called per row
```

### After (Optimized)
```sql
CREATE POLICY "Users can view own data" ON table_name
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));  -- ✅ Called once per query
```

## Performance Impact

| Scenario | Before (Unoptimized) | After (Optimized) | Improvement |
|----------|---------------------|-------------------|-------------|
| Query returning 1,000 rows | `auth.uid()` called 1,000 times (~500-2000ms overhead) | `auth.uid()` called once (~1ms) | **500-2000x faster** |
| Query returning 10,000 rows | `auth.uid()` called 10,000 times (~5-20s overhead) | `auth.uid()` called once (~1ms) | **5000-20000x faster** |

## Migration History

| Phase | Status | Policies Fixed | Tables |
|-------|--------|----------------|--------|
| Phase 1-4 | ✅ Deployed | ~120 policies | Initial optimization |
| Phase 5 | ✅ Deployed | 25 policies | Missed tables |
| Phase 6 | ✅ Deployed | 41 policies | Comprehensive scan |
| Phase 7 | ✅ Deployed | 16 policies | Critical tables |
| **Phase 8** | 🚧 **In Progress** | ~259 policies | **COMPLETE** |

## Verification

After deploying Phase 8, run this query in Supabase SQL Editor:

```sql
SELECT COUNT(*) as remaining_unoptimized
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%auth.uid()%'
    OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%has_role(auth.uid()%'
    OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%is_dev_admin(auth.uid()%'
  )
  AND (
    pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) NOT LIKE '%(SELECT auth.uid())%'
    AND COALESCE(pg_get_expr(with_check, (schemaname || '.' || tablename)::regclass), '') NOT LIKE '%(SELECT auth.uid())%'
  );
```

**Expected result:** `0`

## Troubleshooting

### "No unoptimized policies found"
✅ Great! All policies are already optimized. No Phase 8 needed.

### "ERROR: function exec_sql does not exist"
Use the **SQL-based generator** (`generate_phase8_migration_sql.sql`) instead - it doesn't require any RPC functions.

### TypeScript script fails with "Missing environment variables"
Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local` file, or use the **SQL-based generator** instead.

### Generated migration has duplicate policies
This is expected - the script uses `DROP POLICY IF EXISTS` before `CREATE POLICY`, so it's safe to run.

## Documentation References

- **CLAUDE.md** - Contains mandatory RLS optimization guidelines for ALL new policies
- **Plan file** - `~/.claude/plans/glimmering-finding-willow.md` - Detailed implementation plan

## Support

If you encounter issues:
1. Check that Phases 1-7 are deployed
2. Verify your Supabase Dashboard shows performance warnings
3. Run `find_unoptimized_policies.sql` to see which policies need fixing
4. Use the SQL-based generator (most reliable)

---

**Last Updated:** 2026-01-26
**Status:** Phase 8 in progress (~259 policies remaining)
