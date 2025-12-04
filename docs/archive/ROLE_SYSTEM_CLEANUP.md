# Role System Cleanup - Migration Guide

## Overview

This document explains the database cleanup performed to simplify the role and permission system.

## What Was Changed

### 1. **Removed Legacy `role` Column**
The `user_roles` table previously had TWO ways to assign roles:
- ❌ `role` (enum type `app_role`) - **LEGACY, NOT USED**
- ✅ `role_id` (FK to `roles` table) - **ACTIVE SYSTEM**

We've removed the unused `role` enum column to eliminate confusion.

### 2. **Fixed `get_user_roles()` Function**
Updated the database function to return the correct format expected by the frontend:
- **Before**: `permissions` (JSONB)
- **After**: `permission_names` (TEXT[])

### 3. **Added Default Role Seed Data**
Created 5 default system roles with their permissions:

| Role | Name | Permissions | Description |
|------|------|-------------|-------------|
| **admin** | Administrator | `["*"]` | Full system access (auto-bypasses all checks) |
| **developer** | Developer | `["access_dev_tools", "access_demo_pages", "*"]` | Dev tools + full access |
| **org_admin** | Organization Admin | `["manage_organization", "view_organization", "scan_tickets", "manage_events", "manage_venues", "manage_artists"]` | Full org management |
| **org_staff** | Organization Staff | `["view_organization", "scan_tickets"]` | Limited org access |
| **user** | User | `[]` | Basic user access |

## Database Schema

### Current Structure (After Migration)

```sql
-- Roles table (master list of all roles)
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb, -- Array of permission strings
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-to-Role junction table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE, -- FK to roles table
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);
-- Note: The legacy 'role' enum column has been REMOVED
```

## How to Apply This Migration

### Option 1: Supabase Dashboard (Production)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migration file: `supabase/migrations/20250119000000_cleanup_roles_system.sql`
4. Then run the seed data for roles: `supabase/seed.sql` (just the roles section, lines 428-477)

### Option 2: Supabase CLI (Local Development)

```bash
# Reset local database and apply all migrations + seed data
supabase db reset

# Or apply just the new migration
supabase migration up
```

### Option 3: Remote Push (Production via CLI)

```bash
# Push migrations to remote Supabase project
supabase db push

# Run seed data
supabase db seed.sql
```

## Assigning Roles to Users

### In Supabase Dashboard (SQL Editor)

```sql
-- Get the role ID for 'admin'
SELECT id FROM roles WHERE name = 'admin';

-- Assign admin role to a user
INSERT INTO user_roles (user_id, role_id)
VALUES (
  'user-uuid-here',
  (SELECT id FROM roles WHERE name = 'admin')
);

-- Remove a role from a user
DELETE FROM user_roles
WHERE user_id = 'user-uuid-here'
AND role_id = (SELECT id FROM roles WHERE name = 'admin');
```

### Via Application UI

Use the User Management admin page:
1. Navigate to `/admin/user-management`
2. Click on a user's roles cell
3. Select/deselect roles from the modal
4. Changes are saved automatically

## Admin Role Behavior

**IMPORTANT**: Users with the `admin` role automatically bypass ALL permission and role checks in the application code. You only need to assign the `admin` role - no need to assign individual permissions.

```typescript
// In the application, these all return true for admins:
hasPermission(PERMISSIONS.MANAGE_ORGANIZATION); // ✅ true
hasAnyRole(ROLES.DEVELOPER, ROLES.ORG_ADMIN);   // ✅ true
hasAllPermissions(...);                          // ✅ true
```

See [PERMISSION_MANAGEMENT_GUIDE.md](./PERMISSION_MANAGEMENT_GUIDE.md) for more details.

## Verification

After applying the migration, verify everything works:

```sql
-- Check that roles were created
SELECT name, display_name, permissions FROM roles;

-- Check user_roles structure (should NOT have 'role' column)
\d user_roles

-- Test the get_user_roles function
SELECT * FROM get_user_roles('your-user-id');
-- Should return: role_name, display_name, permission_names (as TEXT[])
```

## Breaking Changes

### None! ✅

This migration is **backwards compatible**:
- The `role` enum column was never used by the application
- The `get_user_roles()` function was already being called by the frontend
- We only fixed the return type to match what the frontend expected

## Troubleshooting

### Error: "column 'role' does not exist"
✅ This is expected! The migration successfully removed the unused column.

### Error: "relation 'roles' does not exist"
❌ Run the seed data to create the default roles.

### Roles not showing up in the app
1. Check that roles exist: `SELECT * FROM roles;`
2. Check user has role assigned: `SELECT * FROM user_roles WHERE user_id = 'your-id';`
3. Clear browser cache and reload the app

## Related Documentation

- [PERMISSION_MANAGEMENT_GUIDE.md](./PERMISSION_MANAGEMENT_GUIDE.md) - How to use permissions in the app
- [ROLE_PERMISSION_QUICK_REFERENCE.md](./ROLE_PERMISSION_QUICK_REFERENCE.md) - Quick reference guide
- [CLAUDE.md](../CLAUDE.md) - Full project documentation
