-- ============================================================================
-- REMOTE DATABASE COMPLETE RESET AND REAPPLY
-- ============================================================================
-- Run this in Supabase Dashboard SQL Editor to completely reset and rebuild
-- your remote database with the consolidated migration
-- ============================================================================

-- STEP 1: Drop all existing objects
-- ============================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Disable triggers temporarily
    SET session_replication_role = 'replica';

    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;

    -- Drop all views
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;

    -- Drop all functions (custom ones, not built-in)
    FOR r IN (
        SELECT proname, oidvectortypes(proargtypes) as argtypes
        FROM pg_proc
        INNER JOIN pg_namespace ns ON (pg_proc.pronamespace = ns.oid)
        WHERE ns.nspname = 'public'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
    END LOOP;

    -- Drop all custom types
    FOR r IN (
        SELECT typname
        FROM pg_type
        WHERE typnamespace = 'public'::regnamespace
        AND typtype = 'e'
    ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;

    -- Re-enable triggers
    SET session_replication_role = 'origin';

    RAISE NOTICE 'All public schema objects dropped successfully';
END $$;

-- STEP 2: Clear migration history
-- ============================================================================
TRUNCATE TABLE supabase_migrations.schema_migrations;

-- ============================================================================
-- STEP 3: Now manually paste and run the entire contents of:
-- supabase/migrations/00000000000000_force_majeure_complete_init.sql
-- ============================================================================

-- STEP 4: Mark the migration as applied
-- ============================================================================
INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
VALUES
  ('00000000000000', ARRAY['-- complete init'], 'force_majeure_complete_init')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- STEP 5: Verification queries
-- ============================================================================
-- Run these after applying the migration to verify everything works

-- Check tables exist
SELECT COUNT(*) as table_count FROM pg_tables WHERE schemaname = 'public';

-- Test anonymous access (should return data, not permission denied)
SET ROLE anon;
SELECT COUNT(*) as env_count FROM environments;
SELECT COUNT(*) as genre_count FROM genres;
SELECT COUNT(*) as flag_count FROM feature_flags;
RESET ROLE;

-- View RLS policies
SELECT tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('environments', 'feature_flags', 'genres')
ORDER BY tablename, policyname;
