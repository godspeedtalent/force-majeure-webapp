-- ==============================================================================
-- RESET MIGRATION HISTORY
-- This clears the migration history table so you can start fresh
-- ==============================================================================

-- Clear all migration records from Supabase's tracking table
TRUNCATE TABLE supabase_migrations.schema_migrations;

-- Done! Now you can pull a fresh schema from production
