-- Migration: Fix activity_logs to profiles relationship
-- Description: Adds a foreign key from activity_logs.user_id to profiles.id
-- to enable PostgREST joins for fetching user information with activity logs

-- Add foreign key constraint from activity_logs.user_id to profiles.id
-- This enables the join syntax: profiles!activity_logs_user_id_profiles_fkey(...)
-- The constraint is named explicitly for clarity in PostgREST queries
ALTER TABLE activity_logs
  ADD CONSTRAINT activity_logs_user_id_profiles_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- Add comment explaining the dual relationship
COMMENT ON CONSTRAINT activity_logs_user_id_profiles_fkey ON activity_logs IS
  'Foreign key to profiles for PostgREST joins. user_id also references auth.users for RLS.';