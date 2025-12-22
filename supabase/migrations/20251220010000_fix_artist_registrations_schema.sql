-- ==========================================
-- FIX ARTIST_REGISTRATIONS TABLE FOR NEW REGISTRATION FORM
-- This migration updates the schema to match the new artist registration form
-- which collects different fields than the original form design
-- ==========================================

-- Step 1: Add new columns needed by the registration form
ALTER TABLE public.artist_registrations
ADD COLUMN IF NOT EXISTS genres UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS press_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tiktok_handle TEXT,
ADD COLUMN IF NOT EXISTS tracks JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS subscribed_to_notifications BOOLEAN DEFAULT true;

-- Step 2: Make legacy required fields nullable since the new form doesn't collect them
-- These fields were required in the original form but aren't in the new simplified form
ALTER TABLE public.artist_registrations
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN phone DROP NOT NULL,
ALTER COLUMN city DROP NOT NULL,
ALTER COLUMN state DROP NOT NULL,
ALTER COLUMN genre DROP NOT NULL;

-- Step 3: Set default values for legacy columns
ALTER TABLE public.artist_registrations
ALTER COLUMN email SET DEFAULT '',
ALTER COLUMN phone SET DEFAULT '',
ALTER COLUMN city SET DEFAULT '',
ALTER COLUMN state SET DEFAULT '',
ALTER COLUMN genre SET DEFAULT '';

-- Step 4: Restore INSERT permission for authenticated users
-- This was revoked by the remote_schema migration
GRANT SELECT, INSERT ON TABLE public.artist_registrations TO authenticated;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN public.artist_registrations.genres IS 'Array of genre UUIDs (new multi-genre support)';
COMMENT ON COLUMN public.artist_registrations.profile_image_url IS 'URL to uploaded profile image';
COMMENT ON COLUMN public.artist_registrations.press_images IS 'Array of URLs to uploaded press photos';
COMMENT ON COLUMN public.artist_registrations.tiktok_handle IS 'TikTok username';
COMMENT ON COLUMN public.artist_registrations.tracks IS 'JSONB array of track objects with name, url, cover_art, platform, recording_type';
COMMENT ON COLUMN public.artist_registrations.subscribed_to_notifications IS 'Whether user opts in to notifications';

-- Step 6: Verify RLS policies still work
-- Users should be able to create registrations when user_id matches auth.uid()
-- The existing policies should still apply after this migration

