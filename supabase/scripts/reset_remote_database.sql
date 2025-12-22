-- ============================================================================
-- REMOTE DATABASE RESET SCRIPT
-- ============================================================================
-- Run this in Supabase SQL Editor to reset and rebuild the remote database
-- WARNING: This will delete all data!
-- ============================================================================

-- Step 1: Drop everything
DROP SCHEMA IF EXISTS public CASCADE;
DROP SCHEMA IF EXISTS storage CASCADE;

-- Step 2: Recreate schemas
CREATE SCHEMA public;
CREATE SCHEMA storage;

-- Step 3: Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

GRANT ALL ON SCHEMA storage TO postgres;
GRANT ALL ON SCHEMA storage TO anon;
GRANT ALL ON SCHEMA storage TO authenticated;
GRANT ALL ON SCHEMA storage TO service_role;

-- ============================================================================
-- Now you need to:
-- 1. Run the consolidated migration file: 00000000000000_force_majeure_complete_init.sql
-- 2. Run the seed file: supabase/seed.sql
-- ============================================================================
