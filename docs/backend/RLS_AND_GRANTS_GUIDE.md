# RLS Policies and GRANT Permissions Guide

## Overview

This guide documents the **two-layer permission system** in Supabase/PostgreSQL that MUST be correctly configured for any table to be accessible via the Supabase client.

**CRITICAL**: Both layers must be configured. Missing either one will result in 403 Forbidden errors.

---

## The Two Permission Layers

### Layer 1: GRANTs (Table-Level Access)

GRANTs control **whether a role can attempt an operation** on a table at all.

```sql
-- Allow authenticated users to attempt CRUD operations
GRANT SELECT, INSERT, UPDATE, DELETE ON my_table TO authenticated;

-- Allow anonymous users to attempt read operations
GRANT SELECT ON my_table TO anon;
```

**Without GRANTs**: The role cannot even attempt the operation → **403 Forbidden**

### Layer 2: RLS Policies (Row-Level Access)

RLS policies control **which specific rows** a role can access.

```sql
-- Enable RLS on the table
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Allow public to read active items
CREATE POLICY "Public can view active items"
  ON my_table FOR SELECT
  USING (is_active = true);

-- Allow admins to do everything
CREATE POLICY "Admins can manage items"
  ON my_table FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

**Without RLS Policies**: If RLS is enabled but no policies match → **No rows returned** (or 403 for writes)

---

## Common Error Patterns

### Error: 403 Forbidden on SELECT

**Symptoms:**
- `new row violates row-level security policy` or
- `permission denied for table my_table`

**Diagnosis Checklist:**

1. **Check GRANTs exist:**
   ```sql
   SELECT grantee, privilege_type
   FROM information_schema.role_table_grants
   WHERE table_name = 'my_table';
   ```

   **Expected output should include:**
   - `authenticated` with SELECT, INSERT, UPDATE, DELETE
   - `anon` with at least SELECT (for public tables)

2. **Check RLS is enabled:**
   ```sql
   SELECT relname, relrowsecurity
   FROM pg_class
   WHERE relname = 'my_table';
   ```

   **If `relrowsecurity = true`**, RLS policies are required.

3. **Check RLS policies exist:**
   ```sql
   SELECT policyname, cmd, qual
   FROM pg_policies
   WHERE tablename = 'my_table';
   ```

### Error: Empty Results (No Rows Returned)

**Symptoms:**
- Query succeeds but returns `[]`
- User is authenticated but can't see their data

**Cause:** RLS policies exist but don't match the current user's context.

**Diagnosis:**
```sql
-- Check what policies apply
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'my_table';

-- Test if user has expected role
SELECT has_role('user-uuid-here', 'admin');

-- Test is_dev_admin fallback
SELECT is_dev_admin('user-uuid-here');
```

---

## New Table Checklist

When creating a new table that needs client access, follow this checklist:

### Step 1: Create the Table

```sql
CREATE TABLE my_new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Step 2: Enable RLS

```sql
ALTER TABLE my_new_table ENABLE ROW LEVEL SECURITY;
```

### Step 3: Grant Permissions to Roles

```sql
-- For tables that need authenticated user access
GRANT SELECT, INSERT, UPDATE, DELETE ON my_new_table TO authenticated;

-- For tables that need public read access
GRANT SELECT ON my_new_table TO anon;

-- For tables that need full public access (rare)
GRANT SELECT, INSERT, UPDATE, DELETE ON my_new_table TO anon;
```

### Step 4: Create RLS Policies

Use this standard pattern for admin-managed tables:

```sql
-- 1. Public can view active items (if applicable)
CREATE POLICY "Public can view active items"
  ON my_new_table FOR SELECT
  USING (is_active = true);

-- 2. Admins/developers can view ALL items
CREATE POLICY "Admins can view all items"
  ON my_new_table FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- 3. Admins/developers can insert
CREATE POLICY "Admins can insert items"
  ON my_new_table FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- 4. Admins/developers can update
CREATE POLICY "Admins can update items"
  ON my_new_table FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- 5. Admins/developers can delete
CREATE POLICY "Admins can delete items"
  ON my_new_table FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );
```

---

## Policy Patterns

### Pattern 1: Public Read, Admin Write

Use for: galleries, events, public content

```sql
-- GRANTs
GRANT SELECT ON my_table TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON my_table TO authenticated;

-- Policies
CREATE POLICY "Public read" ON my_table FOR SELECT USING (is_active = true);
CREATE POLICY "Admin write" ON my_table FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()));
```

### Pattern 2: User Owns Their Data

Use for: user profiles, user settings, user-created content

```sql
-- GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON my_table TO authenticated;

-- Policies
CREATE POLICY "Users manage own data" ON my_table FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all" ON my_table FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()));
```

### Pattern 3: Organization-Based Access

Use for: org events, org members, org settings

```sql
-- GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON my_table TO authenticated;

-- Policies
CREATE POLICY "Org members can view" ON my_table FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can manage" ON my_table FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'org_admin') AND
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

---

## Helper Functions

These helper functions are available in our database:

### `has_role(user_id UUID, role_name TEXT) → BOOLEAN`

Checks if a user has a specific role in the `user_roles` table.

```sql
-- Usage in policy
USING (has_role(auth.uid(), 'admin'))
```

### `is_dev_admin(user_id UUID) → BOOLEAN`

Fallback check for development admins. Useful when role assignment isn't working.

```sql
-- Usage in policy (as fallback)
USING (
  has_role(auth.uid(), 'admin') OR
  is_dev_admin(auth.uid())
)
```

---

## Debugging Queries

### Check all GRANTs on a table

```sql
SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'my_table'
ORDER BY grantee, privilege_type;
```

### Check all RLS policies on a table

```sql
SELECT
  policyname,
  cmd,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'my_table';
```

### Check if RLS is enabled

```sql
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'my_table';
```

### Test user role assignment

```sql
-- Check roles for a specific user
SELECT * FROM user_roles WHERE user_id = 'user-uuid-here';

-- Test has_role function
SELECT has_role('user-uuid-here', 'admin') as has_admin;
SELECT has_role('user-uuid-here', 'developer') as has_developer;

-- Test is_dev_admin fallback
SELECT is_dev_admin('user-uuid-here') as is_dev_admin;
```

### Verify authenticated user context

```sql
-- In Supabase SQL Editor (when logged in as user)
SELECT auth.uid() as current_user_id;
SELECT auth.role() as current_role;
```

---

## Migration Template

Use this template when creating a new table with proper permissions:

```sql
-- ============================================
-- TABLE_NAME - Create table with RLS
-- ============================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- your columns here
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 3. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON table_name TO authenticated;
GRANT SELECT ON table_name TO anon;

-- 4. RLS Policies

-- Public can view active items
CREATE POLICY "Public can view active items"
  ON table_name FOR SELECT
  USING (is_active = true);

-- Admins can view all items
CREATE POLICY "Admins can view all items"
  ON table_name FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Admins can insert items
CREATE POLICY "Admins can insert items"
  ON table_name FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Admins can update items
CREATE POLICY "Admins can update items"
  ON table_name FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Admins can delete items
CREATE POLICY "Admins can delete items"
  ON table_name FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );
```

---

## Summary

| Layer | Controls | Missing = |
|-------|----------|-----------|
| **GRANTs** | Can the role attempt the operation? | 403 Forbidden |
| **RLS Policies** | Which rows can the role access? | Empty results or 403 |

**Always configure both layers when creating tables that need Supabase client access.**

---

*Last updated: December 2025*
