# Database Migration Consolidation Summary

## Overview

The Supabase migrations have been consolidated from **57 scattered migration files** into **one comprehensive database initialization migration**. This simplifies deployment, ensures consistency across environments, and makes future migrations easier to manage.

## What Changed

### Before
- 56 migration files with timestamps (202*.sql, manual_*.sql)
- Complex interdependencies and ordering issues
- Difficult to deploy to new environments
- Hard to track what's in production vs staging vs local

### After
- **1 migration file**: `supabase/migrations/00000000000000_complete_database_init.sql`
- **1 seed file**: `supabase/seed.sql` (reference data)
- **57 archived migrations**: `supabase/migrations/archived/` (for historical reference)
- Clean slate for new environments
- Simple, reproducible deployments

## File Structure

```
supabase/
├── migrations/
│   ├── 00000000000000_complete_database_init.sql  # Main migration
│   └── archived/                                   # Old migrations (backup)
│       ├── 20240101120000_initial_schema.sql
│       ├── 20240102093000_add_events_table.sql
│       └── ... (55 more files)
├── seed.sql                                        # Reference data
└── config.toml                                     # Supabase configuration
```

## What's Included

### `00000000000000_complete_database_init.sql`

The consolidated migration contains the **complete database schema**:

#### Tables (32 total)
- **Core**: cities, roles, organizations, venues, events, genres, artists
- **Users**: profiles, user_roles
- **Ticketing**: ticket_tiers, ticket_holds, orders, order_items, tickets, ticketing_fees, ticketing_sessions, queue_configurations
- **Content**: exclusive_content_grants, event_views, event_images
- **Commerce**: promo_codes, merch
- **System**: feature_flags, webhook_events, api_logs, dev_notes, datagrid_configs
- **Scavenger Hunt**: scavenger_locations, scavenger_claims, scavenger_tokens

#### Functions (20+)
- `has_role()` - Role checking utility
- `create_ticket_hold()` - Reserve ticket inventory
- `get_genre_hierarchy()` - Recursive genre tree
- `handle_new_user()` - Auto-create profile on signup
- `update_updated_at()` - Timestamp trigger
- Many more...

#### Triggers (15+)
- Inventory validation for ticket purchases
- Auto-update `updated_at` timestamps
- Profile creation on auth.users insert
- Order status transitions
- And more...

#### RLS Policies (100+)
- User access control (users can only modify their own data)
- Admin permissions (admins can access everything)
- Public read access (events, artists, venues, genres)
- Organization-based permissions
- Ticket scanning permissions

#### Storage
- `event-images` bucket with public read access
- RLS policies for upload/delete

#### Default Seed Data
Basic reference data included in migration:
- **Cities**: Austin, Dallas, Houston, San Antonio (Texas focus)
- **Roles**: user, admin, developer, org_admin, org_staff
- **Ticketing Fees**: Default 10% platform fee, $3 payment processing fee
- **Promo Codes**: FORCEMAJEURE (50% off), WELCOME10 (10% off)

### `seed.sql`

Separate seed file for **genre reference data**:

- **200+ electronic music genres** with hierarchical relationships
- Top-level: Electronic
- Second-level: House, Techno, Trance, Drum & Bass, Dubstep, Ambient, etc.
- Subgenres: Deep House, Tech House, Liquid Drum & Bass, Melodic Dubstep, etc.
- Idempotent: Uses `ON CONFLICT (name) DO NOTHING` so can be run multiple times
- Transaction-wrapped for atomicity

**Why separate?**
- Seed data is reference content, not schema
- Runs automatically after migrations on fresh databases
- Can be updated independently without new migrations
- Easier to maintain and extend

## Testing the Migration Locally

### Prerequisites
1. **Docker Desktop** installed and running
2. **Supabase CLI** installed (`brew install supabase/tap/supabase`)

### Steps

1. **Start Docker Desktop**
   ```bash
   open -a Docker
   # Wait for Docker to start (check menu bar icon)
   ```

2. **Initialize local Supabase** (first time only)
   ```bash
   supabase init
   ```

3. **Start local Supabase**
   ```bash
   supabase start
   ```
   This will:
   - Pull Supabase Docker images
   - Start local PostgreSQL database
   - Apply `00000000000000_complete_database_init.sql` migration
   - Run `seed.sql` to populate genres
   - Start local API, Studio, and other services

4. **Access local Supabase Studio**
   - URL will be printed after `supabase start` (usually http://localhost:54323)
   - Check tables, data, and RLS policies

5. **Verify tables exist**
   ```bash
   supabase db dump --local --data-only --schema public
   ```

6. **Stop local Supabase** (when done)
   ```bash
   supabase stop
   ```

## Deploying to Staging/Production

### Method 1: Supabase CLI (Recommended)

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Check status
supabase db diff

# Push migration
supabase db push
```

### Method 2: Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **Database** > **Migrations**
3. Click **New Migration**
4. Copy contents of `00000000000000_complete_database_init.sql`
5. Run migration
6. Go to **SQL Editor**
7. Copy contents of `seed.sql`
8. Run seed script

### Method 3: Direct SQL

If you have direct database access:

```bash
psql $DATABASE_URL < supabase/migrations/00000000000000_complete_database_init.sql
psql $DATABASE_URL < supabase/seed.sql
```

## Future Migrations

Moving forward, create **incremental migrations** with proper timestamps:

```bash
# Create new migration
supabase migration new add_feature_name

# Edit the generated file
# supabase/migrations/20250110123456_add_feature_name.sql

# Test locally
supabase db reset  # Drops and recreates from all migrations
supabase start

# Deploy
supabase db push
```

### Migration Best Practices

1. **One logical change per migration** (add table, add column, add index, etc.)
2. **Use descriptive names** (add_email_verification, fix_ticket_inventory_trigger)
3. **Test locally first** with `supabase db reset`
4. **Include rollback instructions** in comments
5. **Handle existing data** with UPDATE statements if needed
6. **Maintain idempotency** where possible (IF NOT EXISTS, ON CONFLICT)

## Seed Data Management

### Updating Genres

To add new genres, edit `supabase/seed.sql`:

```sql
-- Add new genre under existing parent
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'House' LIMIT 1)
FROM (VALUES
  ('New House Subgenre')
) AS t(name)
ON CONFLICT (name) DO NOTHING;
```

Then run the seed file again:

```bash
psql $DATABASE_URL < supabase/seed.sql
```

The `ON CONFLICT DO NOTHING` ensures existing genres aren't duplicated.

### Other Reference Data

For other reference data that should exist in all environments:
1. Add to `seed.sql` if it's relatively static (roles, fee structures)
2. Create a separate migration if it's configuration that changes (promo codes)
3. Use admin UI for environment-specific data (events, artists, venues)

## Authentication Across Environments

**Important**: Each environment has its own `auth.users` table:
- **Local**: Separate user accounts
- **Staging**: Separate user accounts
- **Production**: Separate user accounts

This is **correct behavior** and provides:
- Environment isolation
- Security (can't accidentally affect prod users from staging)
- Independent testing
- Clean separation of concerns

### Developer Accounts

Developers should create accounts in each environment:
1. **Local**: Sign up via local app (http://localhost:5173)
2. **Staging**: Sign up via staging URL
3. **Production**: Sign up via production URL (if needed for testing)

The `handle_new_user()` trigger automatically creates a profile for each new user.

To grant admin role:

```sql
-- Get user ID from profiles table
SELECT id, email FROM profiles;

-- Insert admin role
INSERT INTO user_roles (user_id, role_id)
VALUES (
  'user-uuid-here',
  (SELECT id FROM roles WHERE name = 'admin')
);
```

## Environment Variables

The consolidated migration **does not** include environment-specific configuration:
- API keys
- Stripe keys
- Storage credentials

These should remain in `.env` files per environment.

## Archived Migrations

The old migrations are preserved in `supabase/migrations/archived/`:
- **57 files** total
- Not executed by Supabase
- Kept for historical reference
- Can be deleted after confirming new migration works

## Rollback Strategy

If you need to rollback:

### Local
```bash
supabase db reset  # Drops and recreates
```

### Staging/Production

**Option 1**: Restore from backup
- Supabase maintains automatic backups
- Go to Dashboard > Database > Backups

**Option 2**: Manual rollback
- The old migrations in `archived/` show the evolution
- Create a new migration to reverse changes if needed

## Export Tools

Several scripts were created to help verify the migration:

### `npm run export:schema`
Exports basic schema information (tables, columns, row counts) to JSON.

### `npm run export:data`
Exports all table data to JSON files for backup.

### `npm run export:sql`
Uses `pg_dump` to export complete schema as SQL (requires PostgreSQL client tools).

### `npm run compare:schema`
Compares migration file with live database to identify discrepancies.

### `npm run export:all`
Runs all export and comparison scripts.

**Note**: These scripts are useful for verification but require `SUPABASE_SERVICE_ROLE_KEY` in `.env`.

## Verification Checklist

After deploying the consolidated migration, verify:

- [ ] All 32 tables exist
- [ ] Sample queries work (SELECT * FROM events)
- [ ] RLS policies are active (test as non-admin user)
- [ ] Genres are populated (200+ records)
- [ ] Default seed data exists (roles, cities, fees, promo codes)
- [ ] Auth flow works (sign up creates profile)
- [ ] Functions exist (SELECT has_role('admin'))
- [ ] Triggers fire (updating a record updates `updated_at`)
- [ ] Storage bucket exists (event-images)

Manual verification guide: [scripts/verify-migration-manual.md](scripts/verify-migration-manual.md)

## Benefits of Consolidation

1. **Simplified deployment**: One migration for fresh environments
2. **Consistency**: All environments start from the same baseline
3. **Easier testing**: `supabase db reset` quickly recreates database
4. **Clear history**: Archived migrations preserved, but don't clutter active directory
5. **Reduced errors**: No more "migration already applied" or ordering issues
6. **Better documentation**: Single source of truth for complete schema
7. **Faster onboarding**: New developers can understand schema from one file

## Questions?

If you encounter issues:
1. Check Docker Desktop is running
2. Verify Supabase CLI is installed (`supabase --version`)
3. Review Supabase logs (`supabase status`)
4. Check [Supabase CLI docs](https://supabase.com/docs/guides/cli)

## Summary

- **Old**: 56 migration files, complex dependencies
- **New**: 1 migration file, 1 seed file, clean slate
- **Status**: Ready for testing and deployment
- **Next Step**: Test locally with `supabase start`
