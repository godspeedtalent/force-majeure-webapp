-- Migration: Fix profiles RLS policies to use user_id instead of id
--
-- Problem: The RLS policies for profiles were checking auth.uid() = id, but:
-- 1. The code in AuthContext queries by user_id (.eq('user_id', user.id))
-- 2. For profiles created before a certain trigger fix, id and user_id may differ
-- 3. This causes silent failures where updates appear to succeed but don't actually modify rows
--
-- Solution: Update RLS policies to check user_id instead of id
-- Note: We do NOT modify the id column values because many tables have foreign keys
-- referencing profiles(id). The RLS policy fix is sufficient to resolve the issue.

-- Drop and recreate the user-facing RLS policies to use user_id
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Add a comment explaining the fix
COMMENT ON POLICY "Users can view own profile" ON profiles IS
  'Allows users to view their own profile. Uses user_id for consistency with application code.';

COMMENT ON POLICY "Users can update own profile" ON profiles IS
  'Allows users to update their own profile. Uses user_id for consistency with application code.';