-- Migration: Allow artists to update their own profile
--
-- Problem: Artists linked to a user account (via user_id column) cannot update
-- their own profile because the only UPDATE policy requires admin/developer role.
--
-- Solution: Add an RLS policy that allows users to update artist profiles
-- where their user_id matches auth.uid().

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Artists can update their own profile" ON artists;
DROP POLICY IF EXISTS "Users can insert their own artist profile" ON artists;

-- Add UPDATE policy for artist owners
CREATE POLICY "Artists can update their own profile"
  ON artists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Also add a policy for INSERT if an artist wants to create their own profile
-- (though this is typically done by admins, having it doesn't hurt)
CREATE POLICY "Users can insert their own artist profile"
  ON artists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Artists can update their own profile" ON artists IS
  'Allows users with a linked artist profile (user_id = auth.uid()) to update their own artist information.';

COMMENT ON POLICY "Users can insert their own artist profile" ON artists IS
  'Allows authenticated users to create an artist profile linked to their account.';
