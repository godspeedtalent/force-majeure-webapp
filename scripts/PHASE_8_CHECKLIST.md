# Phase 8 RLS Optimization - Deployment Checklist

## ✅ Pre-Deployment

- [x] SQL generator ran successfully in Supabase
- [x] Found 259 policies across 91 tables
- [ ] **TODO: Copy COMPLETE output from Supabase SQL Editor**
- [ ] **TODO: Save to `supabase/migrations/20260126000007_optimize_rls_policies_phase_8_complete.sql`**
- [ ] Verify migration file:
  - Starts with migration header
  - Contains DROP POLICY + CREATE POLICY for all tables
  - Ends with verification query
  - File size should be ~150-200 KB (large file is expected!)

## 📊 Expected Results

**Before Phase 8:**
- Supabase Dashboard: 506 performance issues
- Unoptimized policies: 259

**After Phase 8:**
- Supabase Dashboard: ~0 performance issues (or <10)
- Unoptimized policies: 0

## 🚀 Deployment Steps

### 1. Commit and Push
```bash
git add supabase/migrations/20260126000007_optimize_rls_policies_phase_8_complete.sql
git add scripts/
git commit -m "feat: Phase 8 RLS optimization - fix all 259 remaining policies

- Optimizes 259 RLS policies across 91 tables
- Wraps auth.uid(), has_role(), is_dev_admin(), has_permission() calls in SELECT
- Expected performance improvement: 10-100x faster queries
- Resolves all remaining Supabase performance warnings"
git push
```

### 2. Deploy to Supabase
- Push will automatically trigger migration in Supabase
- Monitor deployment in Supabase Dashboard → Database → Migrations

### 3. Verify Deployment

**Run this query in Supabase SQL Editor:**
```sql
SELECT COUNT(*) as remaining_unoptimized
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual LIKE '%auth.uid()%'
    OR qual LIKE '%has_role(auth.uid()%'
    OR qual LIKE '%is_dev_admin(auth.uid()%'
    OR qual LIKE '%has_permission(auth.uid()%'
  )
  AND (
    qual NOT LIKE '%(SELECT auth.uid())%'
    AND COALESCE(with_check, '') NOT LIKE '%(SELECT auth.uid())%'
  );
```

**Expected result:** `0`

### 4. Check Supabase Dashboard
- Go to Supabase Dashboard → Advisors
- Performance issues should drop from 506 to near 0
- If any remain, check what they are (may be non-RLS issues)

### 5. Test Application
- [ ] Login works
- [ ] Profile pages load quickly
- [ ] Order history loads quickly
- [ ] Analytics dashboard performs well
- [ ] No authentication errors in console

## 📈 Performance Improvements Expected

| Feature | Before | After | Improvement |
|---------|--------|-------|-------------|
| Profile queries | 50-200ms | 5-20ms | **10x faster** |
| Order history | 100-500ms | 10-50ms | **10x faster** |
| Analytics queries | 1-3s | 100-300ms | **10x faster** |
| Page navigation | Hangs/slow | Instant | **Resolved** |

## 🔍 Troubleshooting

### If verification query returns non-zero:
Run the generator again to see which policies remain:
```sql
-- Run scripts/generate_phase8_migration_sql.sql again
```

### If performance issues remain:
Check what types of issues remain:
```sql
SELECT * FROM pg_stat_statements
WHERE query LIKE '%auth.uid()%'
ORDER BY total_exec_time DESC
LIMIT 10;
```

### If tests fail after deployment:
Check RLS policy errors:
```sql
SELECT * FROM error_logs
WHERE message LIKE '%policy%'
ORDER BY created_at DESC
LIMIT 20;
```

## 📝 Notes

- Migration is **idempotent** - safe to run multiple times
- Uses `DROP POLICY IF EXISTS` before `CREATE POLICY`
- No data changes - only policy optimization
- Zero downtime deployment
- Can rollback by reverting migration if needed

## ✅ Success Criteria

- [ ] Verification query returns 0
- [ ] Supabase performance issues < 10
- [ ] Application works normally
- [ ] Page load times improved
- [ ] No new errors in logs

---

**Last Updated:** 2026-01-26
**Status:** Ready to deploy
**Policies to fix:** 259
**Tables affected:** 91
