# Organization Column Setup Instructions

## Summary
Added organization column to the users grid in Admin Controls. The column shows the user's organization with a clickable link.

## Changes Made

### 1. Frontend Code (✅ Complete)
- **adminGridColumns.tsx**: Added organization column to `userColumns` with Building2 icon
- **get-users/index.ts**: Updated Edge Function to include `organization_name` at top level

### 2. Database Migration (⚠️ Requires Action)
**Location**: `supabase/migrations/20251108000001_add_organization_name_to_users_function.sql`

This migration updates the `get_all_users_with_email()` SQL function to include `organization_name` by joining with the `organizations` table.

## Action Required: Run SQL Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
supabase db push
```

### Option 2: Manually in Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/20251108000001_add_organization_name_to_users_function.sql`
4. Paste and execute the SQL

### Option 3: Using the run-sql script
```bash
node scripts/run-sql.js supabase/migrations/20251108000001_add_organization_name_to_users_function.sql
```

## What the Migration Does

The migration updates the `get_all_users_with_email()` function to:
1. Add `organization_name TEXT` to the return columns
2. Add `LEFT JOIN public.organizations o ON p.organization_id = o.id` to fetch organization names
3. Include `o.name as organization_name` in the SELECT statement

## Testing

After running the migration:
1. Navigate to Admin Controls → User Management
2. The "Organization" column should now appear between "Avatar" and "Roles"
3. Users with an organization will show the organization name with a Building2 icon
4. Clicking the organization name will navigate to that organization's page
5. Users without an organization will show "—"

## Column Details

- **Label**: Organization
- **Icon**: Building2 (from lucide-react)
- **Sortable**: Yes
- **Link**: `/organization/{organization_id}` (when organization exists)
- **Position**: Between avatar and roles columns
- **Fallback**: "—" (when no organization)

## Rollback (if needed)

If you need to rollback, restore the previous version of the function:
```sql
-- Remove organization_name from return type and query
-- (Copy the original from 20251107000004_create_get_all_users_function.sql)
```
