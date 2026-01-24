-- Migration: Allow users to update their own pending artist registrations
-- This enables users to fix typos or update their submission before admin review

-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS "Users can update own pending registration" ON artist_registrations;

-- Allow users to update their own PENDING registrations only
-- The status = 'pending' constraint prevents users from approving their own registration
CREATE POLICY "Users can update own pending registration"
  ON artist_registrations
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Ensure UPDATE permission is granted (should already exist, but verify)
GRANT UPDATE ON TABLE public.artist_registrations TO authenticated;

-- Add comment documenting the policy
COMMENT ON POLICY "Users can update own pending registration" ON artist_registrations IS
  'Allows users to update their own registration while it is still pending review. Users cannot change the status field or modify after admin review.';
