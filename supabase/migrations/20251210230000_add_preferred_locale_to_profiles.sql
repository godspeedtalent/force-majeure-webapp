-- Migration: Add preferred_locale column to profiles table
-- This enables persistence of user language preferences across devices/sessions

-- Add preferred_locale column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_locale VARCHAR(5) DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.preferred_locale IS 'User preferred locale for i18n (en, es, zh)';

-- Create index for potential filtering by locale (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_locale ON public.profiles(preferred_locale);
