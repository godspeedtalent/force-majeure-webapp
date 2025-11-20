-- Migration: Remove is_public column from profiles
-- Public profiles feature has been removed from the application
-- This migration removes the unused is_public column

-- Remove is_public column from profiles table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE profiles DROP COLUMN is_public;
    RAISE NOTICE 'Removed is_public column from profiles table';
  ELSE
    RAISE NOTICE 'is_public column does not exist in profiles table, skipping';
  END IF;
END $$;

-- Update any RLS policies that might reference is_public
-- (Note: Current schema doesn't have policies using is_public, but this is for safety)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Ensure correct RLS policies are in place
-- Users can view their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

-- Users can update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

COMMENT ON TABLE profiles IS 'User profiles table - no longer supports public/private profile distinction';
