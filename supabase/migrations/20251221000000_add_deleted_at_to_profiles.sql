-- Add deleted_at column to profiles table for soft delete functionality
-- Users with a deleted_at timestamp are considered soft-deleted
-- A background job should permanently delete these accounts after 30 days

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add an index for querying active (non-deleted) profiles
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at)
WHERE deleted_at IS NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN public.profiles.deleted_at IS 'Timestamp when the user requested account deletion. Accounts with this set should be permanently deleted after 30 days.';
