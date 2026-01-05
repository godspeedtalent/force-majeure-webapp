-- Add username column to profiles table
-- This provides a unique, user-chosen identifier for users

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text;

-- Create unique index for username (allowing nulls)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
ON public.profiles (username)
WHERE username IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.username IS 'Unique username chosen by the user for identification';

-- Grant permissions
GRANT SELECT (username) ON public.profiles TO anon;
GRANT SELECT, UPDATE (username) ON public.profiles TO authenticated;
