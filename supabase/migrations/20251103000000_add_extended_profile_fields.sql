-- Add extended profile fields
-- Adds: full_name, gender, age_range, home_city, avatar_url (if not exists)

DO $$
BEGIN
  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='profiles' AND column_name='full_name') THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;

  -- Add gender column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='profiles' AND column_name='gender') THEN
    ALTER TABLE public.profiles ADD COLUMN gender TEXT;
  END IF;

  -- Add age_range column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='profiles' AND column_name='age_range') THEN
    ALTER TABLE public.profiles ADD COLUMN age_range TEXT;
  END IF;

  -- Add home_city column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='profiles' AND column_name='home_city') THEN
    ALTER TABLE public.profiles ADD COLUMN home_city TEXT;
  END IF;

  -- Ensure avatar_url column exists (may already exist)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.full_name IS 'User''s full name';
COMMENT ON COLUMN public.profiles.gender IS 'User''s gender identity (optional)';
COMMENT ON COLUMN public.profiles.age_range IS 'User''s age range (e.g., 18-24, 25-34) (optional)';
COMMENT ON COLUMN public.profiles.home_city IS 'User''s home city (optional)';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to user''s profile picture';
