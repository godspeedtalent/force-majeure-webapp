# RLS Policy Compliance Checklist

**Purpose:** Standard checklist for creating and reviewing RLS policies
**Status:** 🟢 Active Reference
**Last Updated:** 2026-01-24

---

## Overview

This checklist ensures all tables in the Force Majeure database have proper RLS (Row-Level Security) coverage. Use this when:

- Creating a new table
- Modifying an existing table's security model
- Reviewing RLS policies during security audits
- Debugging access control issues

---

## Quick Reference: Table Security Classification

| Classification | RLS Required? | Anonymous Access? | Example Tables |
|----------------|---------------|-------------------|----------------|
| **Public Read** | ✅ Yes | ✅ Yes (SELECT only) | `events`, `artists`, `venues` |
| **User-Owned** | ✅ Yes | ❌ No | `profiles`, `orders`, `tickets` |
| **Organization-Scoped** | ✅ Yes | ❌ No | `organizations`, `organization_staff` |
| **Admin-Only** | ✅ Yes | ❌ No | `user_roles`, `app_settings` |
| **Service-Only** | ⚠️ Special | ❌ No | `ticketing_sessions`, archive tables |
| **Analytics/Logs** | ✅ Yes (admin) | ❌ No | `analytics_*`, `activity_logs` |

---

## Checklist for New Tables

### Phase 1: Security Analysis

- [ ] **Classify the table**
  - What security classification? (Public Read, User-Owned, etc.)
  - Who should have access? (roles/permissions)
  - What operations are needed? (SELECT, INSERT, UPDATE, DELETE)

- [ ] **Identify sensitive data**
  - Does table contain PII (Personally Identifiable Information)?
  - Does table contain financial data?
  - Does table contain credentials or secrets?
  - Does table contain competitive/proprietary information?

- [ ] **Define ownership model**
  - Is data user-owned? (e.g., `user_id` column)
  - Is data organization-owned? (e.g., `organization_id` column)
  - Is data publicly accessible?
  - Is data admin-only?

- [ ] **List required operations by role**
  ```
  Table: orders
  - Anonymous: None
  - Authenticated User: SELECT own, INSERT own
  - Admin: SELECT all, UPDATE all, DELETE all
  - Developer: SELECT all (for debugging)
  ```

### Phase 2: RLS Policy Design

- [ ] **Enable RLS**
  ```sql
  ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
  ```

- [ ] **Revoke default permissions**
  ```sql
  REVOKE ALL ON public.table_name FROM anon;
  REVOKE ALL ON public.table_name FROM authenticated;
  ```

- [ ] **Grant necessary table-level permissions**
  ```sql
  -- Allow authenticated users to query (RLS will filter rows)
  GRANT SELECT ON public.table_name TO authenticated;

  -- Allow authenticated users to insert (RLS will validate new rows)
  GRANT INSERT ON public.table_name TO authenticated;

  -- Similar for UPDATE, DELETE if needed
  ```

- [ ] **Create SELECT policy**
  - Who can view which rows?
  - Include admin bypass
  - Include developer bypass (if appropriate)
  - Include owner check
  - Include role-based checks

  ```sql
  CREATE POLICY "Policy description"
    ON public.table_name
    FOR SELECT
    TO authenticated  -- or anon, authenticated depending on need
    USING (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      user_id = auth.uid()  -- Owner check
    );
  ```

- [ ] **Create INSERT policy** (if applicable)
  - Can users create new rows?
  - What validations needed?

  ```sql
  CREATE POLICY "Users can insert own records"
    ON public.table_name
    FOR INSERT
    TO authenticated
    WITH CHECK (
      has_role(auth.uid(), 'admin') OR
      user_id = auth.uid()  -- Can only insert with own user_id
    );
  ```

- [ ] **Create UPDATE policy** (if applicable)
  - Can users modify existing rows?
  - Which columns can be updated?
  - Should updates preserve ownership?

  ```sql
  CREATE POLICY "Users can update own records"
    ON public.table_name
    FOR UPDATE
    TO authenticated
    USING (
      has_role(auth.uid(), 'admin') OR
      user_id = auth.uid()
    )
    WITH CHECK (
      has_role(auth.uid(), 'admin') OR
      user_id = auth.uid()  -- Cannot change ownership
    );
  ```

- [ ] **Create DELETE policy** (if applicable)
  - Can users delete rows?
  - Soft delete vs hard delete?

  ```sql
  CREATE POLICY "Only admins can delete"
    ON public.table_name
    FOR DELETE
    TO authenticated
    USING (
      has_role(auth.uid(), 'admin')
    );
  ```

### Phase 3: Testing

- [ ] **Test anonymous access** (if applicable)
  - Can anonymous users view public data?
  - Are private fields hidden from anonymous users?

- [ ] **Test authenticated user access**
  - Can users view their own data?
  - Are users blocked from viewing other users' data?
  - Can users create new records?
  - Can users update their own records?
  - Can users delete their own records (if allowed)?

- [ ] **Test cross-user access (negative test)**
  - User A cannot view User B's data
  - User A cannot update User B's data
  - User A cannot delete User B's data

- [ ] **Test admin access**
  - Admin can view all records
  - Admin can update all records
  - Admin can delete all records

- [ ] **Test role-based access** (if applicable)
  - Org staff can access org-scoped data
  - Event staff can access event-scoped data
  - Appropriate role isolation

- [ ] **Add automated tests**
  - Create test file in `supabase/functions/rls-tests/tests/`
  - Cover all scenarios above
  - Add to test runner

### Phase 4: Documentation

- [ ] **Add inline SQL comments**
  ```sql
  -- This policy ensures users can only view their own orders.
  -- Admins and developers can view all orders for support purposes.
  -- Financial data protection: No anonymous access allowed.
  CREATE POLICY "Users can view own orders"
    ON public.orders
    FOR SELECT
    TO authenticated
    USING (...);
  ```

- [ ] **Document in migration file**
  - Explain security model
  - List assumptions
  - Note any special cases

- [ ] **Update RLS audit document**
  - Add table to appropriate category
  - Document policies
  - Note any known limitations

### Phase 5: Review

- [ ] **Self-review**
  - Read policies out loud - do they make sense?
  - Are there edge cases not covered?
  - Is the security model clear?

- [ ] **Peer review**
  - Have another developer review policies
  - Discuss attack scenarios
  - Validate business logic

- [ ] **Security review** (for sensitive tables)
  - Have security-focused teammate review
  - Consider penetration testing
  - Document threat model

---

## Checklist for Existing Tables

Use this when auditing or modifying existing tables.

### Phase 1: Discovery

- [ ] **Check if RLS is enabled**
  ```sql
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'your_table_name';
  -- rowsecurity should be true
  ```

- [ ] **List existing policies**
  ```sql
  SELECT policyname, permissive, roles, cmd, qual, with_check
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'your_table_name';
  ```

- [ ] **Check table permissions**
  ```sql
  SELECT grantee, privilege_type
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
  AND table_name = 'your_table_name';
  ```

### Phase 2: Analysis

- [ ] **Verify coverage**
  - Is there a policy for SELECT?
  - Is there a policy for INSERT (if needed)?
  - Is there a policy for UPDATE (if needed)?
  - Is there a policy for DELETE (if needed)?

- [ ] **Check for common issues**
  - [ ] Policies too permissive (e.g., `USING (true)` on sensitive table)
  - [ ] Policies too restrictive (e.g., blocking legitimate access)
  - [ ] Missing admin bypass
  - [ ] Missing developer access (if appropriate)
  - [ ] Recursive function calls (can cause performance issues)
  - [ ] Missing `WITH CHECK` on UPDATE/INSERT policies

- [ ] **Verify admin bypass**
  ```sql
  -- Every policy should start with admin check
  USING (
    has_role(auth.uid(), 'admin') OR  -- ✅ Admin bypass
    /* ...other conditions... */
  )
  ```

- [ ] **Check for security gaps**
  - Can anonymous users access sensitive data?
  - Can users access other users' data?
  - Can users escalate privileges?
  - Can users modify audit fields (created_at, created_by)?

### Phase 3: Testing

- [ ] **Run RLS test suite**
  - Execute `supabase/functions/rls-tests`
  - Review test results
  - Add missing test cases

- [ ] **Manual testing**
  - Test with different user roles
  - Test attack scenarios
  - Test edge cases

- [ ] **Performance testing**
  - Check query performance with RLS
  - Identify slow policies
  - Add indexes if needed

### Phase 4: Remediation

- [ ] **Fix identified issues**
  - Create migration to modify policies
  - Use `DROP POLICY IF EXISTS` to avoid conflicts
  - Add new policies with correct logic

- [ ] **Add missing tests**
  - Create test cases for new scenarios
  - Update test suite

- [ ] **Document changes**
  - Update RLS audit report
  - Add migration comments
  - Update security documentation

---

## Common RLS Policy Patterns

### Pattern 1: User-Owned Data

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Revoke defaults
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- SELECT: View own profile or any if admin
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    id = auth.uid()
  );

-- INSERT: Users auto-create profile on signup
CREATE POLICY "Users can create own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: Update own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    id = auth.uid()
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    id = auth.uid()
  );

-- DELETE: Only admins
CREATE POLICY "Only admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

### Pattern 2: Organization-Scoped Data

```sql
-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Revoke defaults
REVOKE ALL ON public.events FROM anon, authenticated;

-- Grant table permissions
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;

-- SELECT: Public can view published events
CREATE POLICY "Public can view published events"
  ON public.events
  FOR SELECT
  TO anon, authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    status = 'published'  -- Only published events
  );

-- INSERT: Org admins can create events
CREATE POLICY "Org admins can create events"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_permission(auth.uid(), 'manage_events') OR
    is_organization_admin(auth.uid(), organization_id)
  );

-- UPDATE: Org admins and event managers
CREATE POLICY "Org admins can update events"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_permission(auth.uid(), 'manage_events') OR
    is_organization_admin(auth.uid(), organization_id) OR
    is_event_manager(auth.uid(), id)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_permission(auth.uid(), 'manage_events') OR
    is_organization_admin(auth.uid(), organization_id)
  );

-- DELETE: Only admins
CREATE POLICY "Only admins can delete events"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

### Pattern 3: Public Read-Only Data

```sql
-- Enable RLS
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;

-- Revoke defaults
REVOKE ALL ON public.genres FROM anon, authenticated;

-- Grant read access to everyone
GRANT SELECT ON public.genres TO anon, authenticated;

-- Only authenticated users can modify (with proper permissions)
GRANT INSERT, UPDATE, DELETE ON public.genres TO authenticated;

-- SELECT: Everyone can view
CREATE POLICY "Public can view all genres"
  ON public.genres
  FOR SELECT
  TO anon, authenticated
  USING (true);  -- Public data, no restriction

-- INSERT: Only admins
CREATE POLICY "Only admins can create genres"
  ON public.genres
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- UPDATE: Only admins
CREATE POLICY "Only admins can update genres"
  ON public.genres
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- DELETE: Only admins
CREATE POLICY "Only admins can delete genres"
  ON public.genres
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

### Pattern 4: Admin-Only Data

```sql
-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Revoke all default permissions
REVOKE ALL ON public.app_settings FROM anon, authenticated;

-- Grant to authenticated (RLS will filter to admins only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;

-- All operations: Admin only
CREATE POLICY "Only admins can access settings"
  ON public.app_settings
  FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer')
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer')
  );
```

### Pattern 5: Service Role Only

```sql
-- Enable RLS
ALTER TABLE public.ticketing_sessions ENABLE ROW LEVEL SECURITY;

-- Revoke ALL from regular users
REVOKE ALL ON public.ticketing_sessions FROM anon;
REVOKE ALL ON public.ticketing_sessions FROM authenticated;

-- Grant to service_role (used by edge functions)
GRANT ALL ON public.ticketing_sessions TO service_role;

-- Optional: Admin view-only policy for monitoring
CREATE POLICY "Admins can view sessions for monitoring"
  ON public.ticketing_sessions
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer')
  );

-- Note: No INSERT/UPDATE/DELETE policies for authenticated users
-- All session management goes through edge functions using service_role
```

---

## Security Considerations

### Defense in Depth

RLS should be **one layer** of security, not the only layer:

- [ ] **Input validation** - Validate data before insert/update
- [ ] **Application logic** - Business rules in application code
- [ ] **RLS policies** - Database-level enforcement
- [ ] **Audit logging** - Track all data access
- [ ] **Rate limiting** - Prevent abuse
- [ ] **Monitoring** - Alert on suspicious patterns

### Common Security Mistakes

#### ❌ Mistake 1: Overly Permissive Policies

```sql
-- BAD: Allows all authenticated users to see everything
CREATE POLICY "All users can view"
  ON public.sensitive_table
  FOR SELECT
  TO authenticated
  USING (true);
```

#### ✅ Fix: Restrict to owner + admin

```sql
CREATE POLICY "Users can view own records"
  ON public.sensitive_table
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    user_id = auth.uid()
  );
```

#### ❌ Mistake 2: Missing Admin Bypass

```sql
-- BAD: Admin cannot access for support
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());  -- No admin check!
```

#### ✅ Fix: Always include admin bypass

```sql
CREATE POLICY "Users can view own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR  -- Admin bypass
    user_id = auth.uid()
  );
```

#### ❌ Mistake 3: Missing WITH CHECK

```sql
-- BAD: User can change ownership of their order
CREATE POLICY "Users can update own orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());  -- No WITH CHECK!
```

**Attack:**
```sql
-- User A can change order to User B's ID
UPDATE orders
SET user_id = 'user-b-id'
WHERE id = 'my-order-id';
```

#### ✅ Fix: Add WITH CHECK

```sql
CREATE POLICY "Users can update own orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());  -- Prevent ownership change
```

#### ❌ Mistake 4: Recursive Policy Functions

```sql
-- BAD: This function calls itself indirectly
CREATE FUNCTION is_organization_admin(user_id uuid, org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_staff  -- This table has RLS
    WHERE user_id = $1 AND organization_id = $2  -- RLS checks is_organization_admin()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Org admins can view events"
  ON public.events
  FOR SELECT
  USING (is_organization_admin(auth.uid(), organization_id));
```

**Result:** Infinite recursion, query hangs or fails.

#### ✅ Fix: Use SECURITY DEFINER carefully

```sql
-- Mark function as SECURITY DEFINER to bypass RLS
CREATE FUNCTION is_organization_admin(user_id uuid, org_id uuid)
RETURNS boolean AS $$
DECLARE
  result boolean;
BEGIN
  -- Query runs with function owner's permissions, bypassing RLS
  SELECT EXISTS (
    SELECT 1 FROM organization_staff
    WHERE user_id = $1
    AND organization_id = $2
    AND role = 'admin'
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Performance Considerations

### Indexes

RLS policies filter rows, so indexes are critical:

- [ ] **Index ownership columns**
  ```sql
  CREATE INDEX idx_orders_user_id ON orders(user_id);
  ```

- [ ] **Index foreign keys used in policies**
  ```sql
  CREATE INDEX idx_events_organization_id ON events(organization_id);
  ```

- [ ] **Index role/permission lookup columns**
  ```sql
  CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
  CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
  ```

### Query Performance

- [ ] **Test with EXPLAIN ANALYZE**
  ```sql
  EXPLAIN ANALYZE
  SELECT * FROM orders WHERE id = 'some-id';
  -- Check if RLS policy causes sequential scan
  ```

- [ ] **Monitor slow queries**
  - Use Supabase dashboard or pg_stat_statements
  - Identify policies causing performance issues
  - Optimize or simplify complex policies

---

## Conclusion

This checklist ensures **consistent, secure RLS policies** across the Force Majeure database. Use it for:

- ✅ Every new table creation
- ✅ Every RLS policy modification
- ✅ Security audits
- ✅ Code reviews

**Remember:** RLS is the **primary security enforcement layer**. Client-side checks are UX only.

---

## Related Documentation

- [RLS_AUDIT_REPORT.md](./RLS_AUDIT_REPORT.md) - Full audit findings
- [RLS_TEST_SUITE.md](./RLS_TEST_SUITE.md) - Automated testing
- [PERMISSION_ARCHITECTURE.md](./PERMISSION_ARCHITECTURE.md) - Security model
- [RLS_AND_GRANTS_GUIDE.md](../backend/RLS_AND_GRANTS_GUIDE.md) - Implementation guide
