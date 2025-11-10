-- ========================================
-- Remove Music Player and Spotify Integration
-- ========================================
-- This migration removes all music player and Spotify-related database objects

-- Drop songs table and all its policies
DROP POLICY IF EXISTS "Admins can insert songs" ON public.songs;
DROP POLICY IF EXISTS "Admins can update songs" ON public.songs;
DROP POLICY IF EXISTS "Admins can delete songs" ON public.songs;
DROP POLICY IF EXISTS "Anyone can view songs" ON public.songs;

DROP TABLE IF EXISTS public.songs CASCADE;

-- Drop Spotify-related columns from profiles table
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS spotify_connected,
  DROP COLUMN IF EXISTS spotify_token_expires_at;

-- Note: Feature flags (music_player, spotify_integration) should be removed manually
-- or via a separate data migration if needed
