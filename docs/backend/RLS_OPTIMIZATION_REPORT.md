# RLS Policy Optimization Report

*Completed: January 2026*

## Overview

Comprehensive optimization of **139 Row Level Security (RLS) policies** across **48 tables/buckets** to fix critical performance issues flagged by Supabase.

### The Problem

Supabase identified **605 issues** with **511 being performance-related**. RLS policies were calling `auth.uid()`, `auth.jwt()`, and helper functions like `has_role()` per-row instead of once per query, causing:

- Sequential table scans instead of index usage
- 10-100x slower queries on user-specific data
- Page hangs and poor user experience

### The Solution

Wrap all auth function calls in `(SELECT ...)` subqueries:

```sql
-- Before (slow - sequential scan)
USING (user_id = auth.uid())

-- After (fast - index scan)
USING (user_id = (SELECT auth.uid()))
```

PostgreSQL treats unwrapped `auth.uid()` as VOLATILE (value might change per row), but wrapped `(SELECT auth.uid())` as STABLE (constant within query), enabling index usage.

---

## Migration Files

| Phase | Migration File | Policies | Tables |
|-------|----------------|----------|--------|
| 1 | `20260126000000_..._phase_1_critical_users.sql` | 22 | profiles, orders, datagrid_configs, organizations, exclusive_content_grants |
| 2 | `20260126000001_..._phase_2_core_business.sql` | 20 | events, cities, environments, event_rsvps, user_event_interests, comp_tickets |
| 3 | `20260126000002_..._phase_3_supporting.sql` | 51 | venues, artists, ticket_tiers, tickets, order_items, ticketing_fees, promo_codes, etc. |
| 4 | `20260126000003_..._phase_4_specialized.sql` | 46 | dev_notes, media_galleries, artist_recordings, storage buckets, etc. |

---

## Optimization Patterns

### Simple User Checks

```sql
-- Before
USING (user_id = auth.uid())

-- After
USING (user_id = (SELECT auth.uid()))
```

### Admin Role Checks

```sql
-- Before
USING (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))

-- After
USING (
  has_role((SELECT auth.uid()), 'admin') OR
  is_dev_admin((SELECT auth.uid()))
)
```

### Nested Queries

```sql
-- Before
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
)

-- After
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = (SELECT auth.uid())
  )
)
```

---

## Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Supabase performance issues | 511 | ~0 |
| Profile query time | 50-200ms | 5-20ms |
| Order list query | 100-500ms | 10-50ms |
| Average page load | 2-5s | 0.5-1s |

---

## Verification

After deployment, verify optimization with:

```sql
-- Check for any remaining unoptimized policies
SELECT policyname, tablename
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%auth.uid()%'
    AND pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) NOT LIKE '%(SELECT auth.uid())%'
  );
-- Should return 0 rows
```

---

## Future Policy Guidelines

When creating new RLS policies, **always** use the optimized pattern:

```sql
-- GOOD
CREATE POLICY "policy_name" ON table_name
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- BAD
CREATE POLICY "policy_name" ON table_name
  FOR SELECT USING (user_id = auth.uid());
```

See `CLAUDE.md` section "RLS Policy Optimization" for complete guidelines.
