-- Add YouTube as a valid platform for artist_recordings
-- The TypeScript types already support 'youtube' but the DB constraint was missing it

-- Drop the old constraint
ALTER TABLE artist_recordings DROP CONSTRAINT IF EXISTS artist_recordings_platform_check;

-- Add the new constraint with youtube included
ALTER TABLE artist_recordings ADD CONSTRAINT artist_recordings_platform_check
  CHECK (platform IN ('spotify', 'soundcloud', 'youtube'));

-- Update comment to reflect the change
COMMENT ON TABLE artist_recordings IS 'Stores linked music tracks (Spotify/SoundCloud/YouTube) for artists';
