# Apply dev_notes Migration

The `dev_notes` table migration needs to be applied manually since Docker isn't running.

## Steps:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/orgxcrnnecblhuxjfruy
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/20251105000010_create_dev_notes_table.sql`
5. Click **Run** to execute the migration

## Alternative: Run via CLI

If you have access to the database password, you can run:

```powershell
npx supabase db push --include-all
```

Or manually mark migrations as applied and push only new ones.

Once the migration is applied, the DevNotesSection will work correctly.
