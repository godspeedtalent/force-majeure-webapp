# Database Migration Information

## Current State

All migrations have been consolidated into a single comprehensive initialization file:
- **File**: `00000000000000_force_majeure_complete_init.sql`
- **Last Updated**: 2025-11-21

## What's Included

The consolidated migration includes:

1. **Core Schema** (35+ tables)
   - Events, venues, artists, ticket tiers
   - Orders, tickets, users/profiles
   - Organizations, roles, permissions
   - Feature flags, environments

2. **Advanced Features**
   - Row Level Security (RLS) policies for all tables
   - Helper functions and views
   - Dynamic data grid schema introspection
   - Queue management for ticketing
   - Scavenger hunt system
   - Artist registration system

3. **Storage**
   - Event images bucket with policies

4. **Proper Permissions**
   - Grant statements for anon, authenticated, service_role
   - All policies properly cleaned up (no duplicates)

## Seed Data

Seed data is in `seed.sql` and includes:
- 200+ electronic music genres (hierarchical)
- Default system roles (admin, developer, org_admin, org_staff, user)
- Environment configurations (dev, qa, prod, all)
- Feature flags

## How to Use

### Fresh Database Setup

1. Apply the migration:
   ```bash
   npx supabase db reset
   ```

2. Seed data will be applied automatically after migrations

### Production Deployment

Run this SQL in the Supabase SQL editor:
```sql
-- Run the init migration first
-- Then seed.sql will run automatically
```

## Policy Cleanup

All duplicate policies have been removed. Each table now has clean, non-conflicting policies:
- `datagrid_configs`: 4 policies (view/insert/update/delete own configs)
- `profiles`: 5 policies (users can view/update own, admins can view/update/delete all)
- `venues`: 4 policies (public view, admins can insert/update/delete)
- All other tables follow similar patterns

## Troubleshooting

If you get 403 errors:
1. Check that the migration was fully applied
2. Verify you have the correct role assigned
3. Check that RLS is enabled on the table
4. Verify the policy exists: `SELECT * FROM pg_policies WHERE tablename = 'your_table';`

## Migration History

Previous migrations have been consolidated. Old migration files are archived in `migrations/archived/`.
