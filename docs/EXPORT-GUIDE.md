# Quick Start: Export Your Database Schema

Follow these steps to export your current Supabase database and compare it with the migration.

## Step 1: Export Schema (TypeScript method)

This is the easiest method and works with your existing Supabase setup:

```bash
npm run export:schema
```

This will create a JSON file in `schema-exports/` with all your tables, columns, functions, triggers, and policies.

## Step 2: Compare with Migration

```bash
npm run compare:schema
```

This will analyze the differences between your live database and the new consolidated migration file, showing:
- ✅ Objects that match
- ⚠️ Objects in database but NOT in migration (need to add)
- ℹ️ Objects in migration but not in database (expected for new deployments)

## Step 3: Export Data (Optional)

If you want to backup your data as well:

```bash
npm run export:data
```

This creates JSON files with all table data. **Note**: This may contain sensitive information, so review before sharing.

## Step 4: Review Results

Check the `schema-exports/` directory for:
- `schema-*.json` - Complete schema export
- `comparison-*.json` - Detailed comparison results
- `data-*.json` - Data export (if you ran it)

## Alternative: Direct SQL Export (More Complete)

If you need the most complete export, use the SQL method:

### Setup (one-time):

1. Install PostgreSQL client tools if not installed:
   ```bash
   # macOS
   brew install postgresql

   # Ubuntu/Debian
   sudo apt-get install postgresql-client
   ```

2. Get your database credentials from Supabase:
   - Go to **Project Settings** > **Database**
   - Scroll to **Connection string** section
   - Look for the "URI" connection string

3. Create a `.env` file in the project root:
   ```env
   DB_HOST=db.xxxxxxxxxxxxx.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your-password-here
   ```

### Run the export:

```bash
npm run export:sql
```

This creates three files:
- `schema-*.sql` - Schema only (DDL)
- `data-*.sql` - Data only (INSERT statements)
- `complete-*.sql` - Complete database dump

## What to Look For

After running the comparison, check for:

### ⚠️ Critical Issues (fix these):
- **Tables in DB but NOT in migration** - These tables exist in production but won't be created in new environments
- **Columns in DB but NOT in migration** - Missing columns that your app may depend on
- **Functions in DB but NOT in migration** - Missing stored procedures

### ℹ️ Expected Differences:
- **Tables/functions in migration but not in DB** - This is normal if you're creating the migration for the first time

## Next Steps

1. **Review the comparison output** - Focus on the ⚠️ warnings
2. **Check the exported schema JSON** - Look at `schema-exports/schema-*.json` for details
3. **Share the comparison results** - Send me the console output or the `comparison-*.json` file
4. **I'll update the migration** - Based on what's missing, I'll update the consolidated migration file

## Example Comparison Output

```
🔍 Comparing migration with live database...

⚠️  Tables in database but NOT in migration:
   - user_sessions
   - temp_uploads

⚠️  Columns in database but NOT in migration:
   - events.legacy_id
   - profiles.old_phone_format

✅ Migration looks mostly complete!
```

## Troubleshooting

### "Permission denied" errors
Make sure you're using your service role key, not the anon key. Check your `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (your service role key)
```

### Can't find comparison file
Make sure you run `export:schema` before `compare:schema`.

### "Function not found" errors
Some queries may fail if your Supabase project has restricted access. Use the SQL export method instead:
```bash
npm run export:sql
```

## Need Help?

If you encounter any issues or the comparison reveals significant differences, share:
1. The console output from `npm run compare:schema`
2. The `schema-exports/comparison-*.json` file
3. Any relevant table structures from `schema-exports/schema-*.json`

I'll help update the migration to include everything!
