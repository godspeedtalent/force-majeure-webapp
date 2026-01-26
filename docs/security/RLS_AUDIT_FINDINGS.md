# RLS Security Audit Findings

*Audit Date: January 2026*
*Status: Active monitoring required*

## Executive Summary

### Security Posture

**Strengths:**
- Extensive RLS coverage (128+ migrations with policies)
- Recent standardization to `has_role()` pattern
- Critical tables (orders, tickets, profiles) well-protected
- Service-role-only pattern adopted for sensitive operations

**Resolved Issues:**
- Recursion bugs in helper functions (Jan 2026)
- Ticketing session lockdown (Jan 2026)
- RLS performance optimization (139 policies fixed)

**Ongoing Concerns:**
- No automated RLS test suite
- Client-side permission checks give false sense of security
- Need periodic re-audit as new tables added

---

## Critical Tables (Require Strict RLS)

| Table | Security Level | Notes |
|-------|---------------|-------|
| `orders`, `order_items` | Financial | Owner + admin only |
| `tickets` | PII | Owner + admin, supports transfers |
| `profiles` | PII | User can only see own profile |
| `user_roles` | Critical | Admin-only for mutations |
| `ticketing_sessions` | Operational | Service-role only |
| `promo_codes` | Financial | Admin/org-admin only |
| `payment_intents` | Financial | Service-role only |

---

## RLS Policy Patterns

### Pattern 1: Owner + Admin Access

```sql
CREATE POLICY "Users can view own, admins can view all"
  ON table_name FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    has_role((SELECT auth.uid()), 'admin')
  );
```

### Pattern 2: Service Role Only

```sql
REVOKE ALL ON sensitive_table FROM anon, authenticated;
GRANT ALL ON sensitive_table TO service_role;

-- Optional: Admin monitoring
CREATE POLICY "Admins can view for monitoring"
  ON sensitive_table FOR SELECT
  TO authenticated
  USING (has_role((SELECT auth.uid()), 'admin'));
```

### Pattern 3: Public Read

```sql
CREATE POLICY "Public read access"
  ON public_table FOR SELECT
  TO anon, authenticated
  USING (status = 'published');
```

---

## Resolved Findings

### Recursion Bugs (FIXED Jan 2026)

**Issue:** RLS policies calling helper functions that query tables with RLS policies created infinite loops.

**Solution:** Helper functions marked as `SECURITY DEFINER` to bypass RLS:

```sql
CREATE FUNCTION is_organization_staff(...)
RETURNS boolean AS $$
  -- Query runs with owner permissions, bypassing RLS
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Migrations:**
- `20260124010000_fix_screening_reviews_rls_recursion.sql`
- `20260123100000_fix_organization_staff_rls_recursion.sql`
- `20260122100000_fix_event_staff_rls_recursion.sql`

### Performance Issues (FIXED Jan 2026)

**Issue:** 511 Supabase performance warnings due to unoptimized `auth.uid()` calls.

**Solution:** Wrapped all auth calls in `(SELECT ...)` subqueries.

**See:** [RLS_OPTIMIZATION_REPORT.md](../backend/RLS_OPTIMIZATION_REPORT.md)

---

## Remaining Action Items

### Testing (Not Yet Implemented)

- [ ] Create automated RLS test suite
- [ ] Test cases for critical 6 tables (orders, tickets, profiles, user_roles, promo_codes, ticketing_sessions)
- [ ] Integrate tests into CI/CD

### Monitoring

- [ ] Add logging for RLS policy violations
- [ ] Alert on suspicious access patterns
- [ ] Periodic re-audit (quarterly)

### Documentation

- [ ] Document security model for new developers
- [ ] Add inline comments to RLS migrations
- [ ] Maintain this audit document

---

## Quick Reference

### Verifying RLS on a Table

```sql
-- Check if table has RLS enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'your_table_name';

-- List all policies on a table
SELECT policyname, permissive, cmd, qual
FROM pg_policies
WHERE tablename = 'your_table_name';
```

### Testing Policy as Different User

```sql
-- Set session to act as specific user
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims = '{"sub": "user-uuid-here"}';

-- Run your query
SELECT * FROM orders;

-- Reset
RESET role;
```

---

## Related Documentation

- [RLS_AND_GRANTS_GUIDE.md](../backend/RLS_AND_GRANTS_GUIDE.md) - How to create new tables with RLS
- [RLS_OPTIMIZATION_REPORT.md](../backend/RLS_OPTIMIZATION_REPORT.md) - Performance optimization details
- [PERMISSION_MANAGEMENT_GUIDE.md](./PERMISSION_MANAGEMENT_GUIDE.md) - Application permission system
- [RLS_COMPLIANCE_CHECKLIST.md](./RLS_COMPLIANCE_CHECKLIST.md) - Policy creation checklist
