# Database Migration Strategy

## Overview

This document outlines when and how to run database migrations for the Force Majeure application.

## ❌ DO NOT Auto-Run Migrations On Build

**Never run migrations as part of `npm run build` for these critical reasons:**

### 1. **Separation of Concerns**
- **Build** = Compile/bundle frontend code (should be environment-agnostic)
- **Deploy** = Run migrations + deploy code (environment-specific)
- Mixing these creates tight coupling and deployment risks

### 2. **Security Risks**
- Build environments (CI/CD runners) shouldn't have production database credentials
- Exposes production connection strings in build logs
- Increases attack surface

### 3. **Race Conditions**
- Multiple builds/deploys could run migrations simultaneously
- Can cause deadlocks, duplicate migrations, or partial schema changes
- No transaction guarantees across build processes

### 4. **No Rollback Strategy**
- If migration fails mid-build, database is in broken state
- Build artifact is now tied to specific DB state
- Can't revert to previous build without DB rollback

### 5. **CI/CD Pipeline Breaks**
- Same build artifact should deploy to dev → staging → prod
- Build shouldn't know which environment it's targeting
- Migrations are environment-specific operations

## ✅ Recommended Approaches

### Local Development

#### Option 1: Manual Migration (Most Control)
```bash
# Reset local DB and apply all migrations
npm run supabase:db:reset

# Then start dev server
npm run dev
```

#### Option 2: Fresh Start with Migrations (Added)
```bash
# Resets DB and starts dev server in one command
npm run dev:migrate
```

#### Option 3: Apply Migrations Without Reset
```bash
# If you just want to apply new migrations
supabase db push

# Then start dev
npm run dev
```

### Production Deployment

#### Recommended: Separate Deployment Steps

**Step 1: Run Migrations First**
```bash
# On your production server or CI/CD
supabase db push --linked

# Or using direct connection
supabase migration up --db-url "$DATABASE_URL"
```

**Step 2: Deploy Application**
```bash
# After migrations succeed
npm run build
# Deploy built artifact
```

#### CI/CD Example (GitHub Actions)

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      # Step 1: Run migrations
      - name: Run Database Migrations
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
        run: |
          npx supabase link --project-ref $PROJECT_REF
          npx supabase db push

      # Step 2: Build application (after migrations succeed)
      - name: Build Application
        run: npm run build

      # Step 3: Deploy
      - name: Deploy to Hosting
        run: |
          # Your deployment command here
          # npm run deploy or similar
```

### Supabase Specific: Use Platform Features

Supabase provides built-in migration management:

1. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. **Push migrations**:
   ```bash
   supabase db push
   ```

3. **Check migration status**:
   ```bash
   supabase migration list
   ```

## Migration Best Practices

### 1. **Always Test Migrations Locally First**
```bash
# Reset local DB to test migration from scratch
npm run supabase:db:reset

# Verify schema
npm run supabase:status
```

### 2. **Write Reversible Migrations**
```sql
-- Good: Can be rolled back
ALTER TABLE users ADD COLUMN new_column TEXT;

-- Bad: Destructive, can't rollback
DROP TABLE old_data;
```

### 3. **Use Transactions**
```sql
BEGIN;
  -- Your migration steps
  ALTER TABLE ...;
  CREATE INDEX ...;
COMMIT;
```

### 4. **Migration Naming Convention**
```
YYYYMMDDHHMMSS_descriptive_name.sql
00000000000001_add_environments_table.sql
00000000000002_add_headliner_to_events.sql
```

### 5. **Create Migrations for Schema Changes**
```bash
# After making changes to schema
npm run supabase:migration:new add_user_preferences
```

## Environment-Specific Migrations

### Development
- Use `supabase db reset` freely
- Test migrations multiple times
- Can use seed data

### Staging
- Mirror production process
- Run migrations before deployment
- Test rollback procedures

### Production
- **Always backup first**: Supabase does this automatically
- Run migrations during low-traffic periods
- Have rollback plan ready
- Monitor for errors after deployment

## Troubleshooting

### Migration Failed
```bash
# Check status
supabase migration list

# View logs
supabase db logs

# Rollback if needed (manual)
psql "$DATABASE_URL" -f path/to/rollback.sql
```

### Schema Drift
```bash
# Check differences between local and remote
supabase db diff

# Create migration from remote changes
supabase db pull
```

## Available Commands

```bash
# Development
npm run dev                    # Start dev server
npm run dev:full              # Start Supabase + dev server
npm run dev:migrate           # Reset DB + start dev server

# Supabase Management
npm run supabase:start        # Start local Supabase
npm run supabase:stop         # Stop local Supabase
npm run supabase:status       # Check Supabase status
npm run supabase:db:reset     # Reset local DB (apply all migrations)
npm run supabase:migration:new # Create new migration
npm run supabase:studio       # Open Supabase Studio

# Direct Supabase CLI
supabase db push              # Apply pending migrations to linked project
supabase migration list       # List migration status
supabase db diff              # Show schema differences
```

## Summary

✅ **DO**:
- Run migrations as a **separate deployment step**
- Use Supabase's built-in migration tools
- Test migrations locally first
- Backup before production migrations
- Use `npm run dev:migrate` for local fresh starts

❌ **DON'T**:
- Run migrations during build process
- Auto-run migrations on app startup
- Skip testing migrations locally
- Make destructive changes without backups
- Run migrations in parallel
