# Database Export & Migration Verification Scripts

This directory contains scripts to export your current Supabase database schema and data, and compare it with the migration file.

## Scripts Overview

### 1. `export-schema.ts`
Exports the complete database schema from Supabase using the Supabase client.

**Exports:**
- Tables with columns and types
- Constraints (primary keys, foreign keys, unique, check)
- Indexes
- Functions (stored procedures)
- Triggers
- RLS policies
- Views
- Enums
- Extensions

**Usage:**
```bash
npm run export:schema
# or
npx tsx scripts/export-schema.ts
```

### 2. `export-data.ts`
Exports all data from your database tables.

**Exports:**
- Complete JSON dump of all table data
- Individual files for each table
- Summary statistics

**Usage:**
```bash
npm run export:data
# or
npx tsx scripts/export-data.ts
```

⚠️ **Warning**: This exports all data including potentially sensitive information. Review before sharing.

### 3. `export-direct-sql.sh`
Uses `pg_dump` to export the database directly (more comprehensive than Supabase client).

**Requires:**
- PostgreSQL client tools (`pg_dump`)
- Direct database connection details

**Setup:**
1. Create a `.env` file in the root directory:
```env
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password
```

2. Get connection details from Supabase:
   - Go to Project Settings > Database
   - Copy connection string
   - Extract host and password

**Usage:**
```bash
chmod +x scripts/export-direct-sql.sh
./scripts/export-direct-sql.sh
```

**Exports:**
- `schema-{timestamp}.sql` - Schema only
- `data-{timestamp}.sql` - Data only
- `complete-{timestamp}.sql` - Complete dump

### 4. `compare-schema.ts`
Compares your migration file with the live database to find discrepancies.

**Checks for:**
- Tables in DB but not in migration
- Tables in migration but not in DB
- Missing columns
- Missing functions
- Missing RLS policies

**Usage:**
```bash
npm run compare:schema
# or
npx tsx scripts/compare-schema.ts
```

**Note**: Run `export-schema.ts` first to generate the schema export file.

## Recommended Workflow

### Step 1: Export Current Schema
```bash
npm run export:schema
```

### Step 2: Export Current Data (optional)
```bash
npm run export:data
```

### Step 3: Compare with Migration
```bash
npm run compare:schema
```

### Step 4: Review Differences
- Check `schema-exports/comparison-*.json` for detailed differences
- Review console output for missing objects

### Step 5: Update Migration (if needed)
If the comparison reveals missing objects:
1. Review the differences
2. Update `00000000000000_complete_database_init.sql`
3. Re-run comparison to verify

## NPM Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "export:schema": "tsx scripts/export-schema.ts",
    "export:data": "tsx scripts/export-data.ts",
    "compare:schema": "tsx scripts/compare-schema.ts",
    "export:all": "npm run export:schema && npm run export:data && npm run compare:schema"
  }
}
```

## Environment Variables

The scripts use these environment variables (from `.env` or environment):

### Supabase Client Scripts
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin access)

### Direct SQL Export
- `DB_HOST` - Database host (e.g., `db.xxxxx.supabase.co`)
- `DB_PORT` - Database port (default: `5432`)
- `DB_NAME` - Database name (default: `postgres`)
- `DB_USER` - Database user (default: `postgres`)
- `DB_PASSWORD` - Database password

## Output Directory

All exports are saved to `schema-exports/`:
```
schema-exports/
├── schema-YYYY-MM-DD-HH-MM.json
├── data-YYYY-MM-DD-HH-MM.json
├── tables-YYYY-MM-DD-HH-MM/
│   ├── events.json
│   ├── venues.json
│   └── ...
├── schema-YYYY-MM-DD_HH-MM-SS.sql
├── data-YYYY-MM-DD_HH-MM-SS.sql
├── complete-YYYY-MM-DD_HH-MM-SS.sql
└── comparison-{timestamp}.json
```

## Troubleshooting

### "Permission denied" errors
- Make sure you're using the service role key, not the anon key
- Check that RLS policies allow admin access

### "Function not found" errors
Some Supabase projects don't expose `pg_` system tables. Use the direct SQL export instead:
```bash
./scripts/export-direct-sql.sh
```

### Missing tables in export
- Verify the table exists in Supabase dashboard
- Check that it's in the `public` schema
- Ensure RLS allows access

### Comparison shows false positives
The comparison script does basic text parsing. For detailed comparison:
1. Use the SQL exports from `export-direct-sql.sh`
2. Manually diff with migration file
3. Focus on missing tables/columns that appear in both lists

## Security Notes

⚠️ **Important**:
- Export files contain database structure and potentially sensitive data
- Never commit exports with real data to version control
- Add `schema-exports/` to `.gitignore`
- Review exports before sharing with team members
- Store service role keys securely (use `.env` file, never commit)

## Next Steps

After verifying your migration:
1. Test migration on a fresh Supabase project
2. Archive old migrations to `migrations/archive/`
3. Update documentation
4. Share the verified migration with your team
