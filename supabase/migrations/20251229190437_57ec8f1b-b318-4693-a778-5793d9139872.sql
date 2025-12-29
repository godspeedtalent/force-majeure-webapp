-- Add a JSONB column to store complete track metadata during registration
-- This preserves track name, cover art, platform, and type (track vs dj_set)
ALTER TABLE public.artist_registrations
ADD COLUMN IF NOT EXISTS tracks_metadata JSONB DEFAULT '[]'::jsonb;

-- Add a comment explaining the structure
COMMENT ON COLUMN public.artist_registrations.tracks_metadata IS 'Array of track objects: [{name, url, coverArt, platform, recordingType}]';