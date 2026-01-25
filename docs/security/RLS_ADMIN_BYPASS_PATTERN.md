# RLS Admin Bypass Pattern

**Last Updated:** 2026-01-25

This document describes the standardized pattern for admin/developer bypass in Row-Level Security (RLS) policies.

## The Standard Function

Use `is_admin_or_developer(auth.uid())` for all admin bypass checks:

```sql
CREATE POLICY "Example policy"
  ON my_table FOR SELECT
  TO authenticated
  USING (
    is_admin_or_developer(auth.uid()) OR
    <normal user conditions>
  );
```

## Why This Pattern?

### Problems with Previous Approach

The codebase had multiple inconsistent patterns:

```sql
-- Pattern 1: Two checks
has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid())

-- Pattern 2: Three checks
has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer') OR is_dev_admin(auth.uid())

-- Pattern 3: Feature flag based (broken)
is_dev_admin(auth.uid())  -- Was checking feature flags, not roles!
```

### Issues

1. **Inconsistency**: Different policies used different patterns
2. **Broken is_dev_admin()**: Was checking feature flags, not user roles
3. **Verbose**: Required multiple function calls
4. **Error-prone**: Easy to forget a check

### Solution

The new `is_admin_or_developer()` function:

1. **Single function** - One call handles both admin and developer roles
2. **Consistent** - Same behavior everywhere
3. **Fixed** - Actually checks user roles, not feature flags
4. **Clear naming** - Explicitly describes what it checks

## Function Reference

### `is_admin_or_developer(user_id UUID)`

Returns `TRUE` if user has `admin` or `developer` role.

```sql
-- Example usage in RLS policy
USING (
  is_admin_or_developer(auth.uid()) OR
  user_id = auth.uid()
)
```

### `is_dev_admin(user_id UUID)` (DEPRECATED)

Now equivalent to `is_admin_or_developer()`. Kept for backwards compatibility.

**Use `is_admin_or_developer()` in new policies.**

### Related Functions

| Function | Description | Admin Bypass |
|----------|-------------|--------------|
| `has_role(uid, role)` | Check specific role | Yes (admins pass all role checks) |
| `has_permission(uid, perm)` | Check specific permission | Yes (admins have `*` permission) |
| `is_event_manager(uid, event_id)` | Check event manager | Yes (returns true for admins) |
| `is_event_staff(uid, event_id)` | Check event staff | Yes (returns true for admins) |
| `is_organization_admin(uid, org_id)` | Check org admin | Yes (returns true for admins) |

## Examples

### SELECT Policy

```sql
CREATE POLICY "Users can view their orders, admins can view all"
  ON orders FOR SELECT
  TO authenticated
  USING (
    is_admin_or_developer(auth.uid()) OR
    user_id = auth.uid()
  );
```

### INSERT Policy

```sql
CREATE POLICY "Only admins can create promo codes"
  ON promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_or_developer(auth.uid())
  );
```

### UPDATE Policy with Column Restrictions

```sql
CREATE POLICY "Users can update their profile, admins can update any"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_developer(auth.uid()) OR
    id = auth.uid()
  )
  WITH CHECK (
    is_admin_or_developer(auth.uid()) OR
    id = auth.uid()
  );
```

### Combined with Role-Based Checks

```sql
CREATE POLICY "Event managers and admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_developer(auth.uid()) OR
    is_event_manager(auth.uid(), id)
  );
```

## Migration Guide

### From `has_role('admin') OR is_dev_admin()`

```sql
-- Old pattern
USING (
  has_role(auth.uid(), 'admin') OR
  is_dev_admin(auth.uid()) OR
  <conditions>
)

-- New pattern
USING (
  is_admin_or_developer(auth.uid()) OR
  <conditions>
)
```

### From `has_role('admin') OR has_role('developer') OR is_dev_admin()`

```sql
-- Old pattern (verbose)
USING (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'developer') OR
  is_dev_admin(auth.uid()) OR
  <conditions>
)

-- New pattern (clean)
USING (
  is_admin_or_developer(auth.uid()) OR
  <conditions>
)
```

## Notes

1. **SECURITY DEFINER**: All bypass functions use `SECURITY DEFINER` to avoid RLS recursion
2. **NULL safety**: Functions return `FALSE` for `NULL` user IDs
3. **Performance**: Single function call is more efficient than multiple
4. **Backwards compatible**: Old patterns still work, but new code should use the standard pattern
