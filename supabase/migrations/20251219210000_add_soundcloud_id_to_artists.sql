-- Add soundcloud_id column to artists table
-- This stores the SoundCloud username/permalink for artist profiles

ALTER TABLE artists
ADD COLUMN IF NOT EXISTS soundcloud_id TEXT;

-- Add index for faster lookups by soundcloud_id
CREATE INDEX IF NOT EXISTS idx_artists_soundcloud_id ON artists (soundcloud_id) WHERE soundcloud_id IS NOT NULL;

-- Add index for faster lookups by spotify_id (if not exists)
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists (spotify_id) WHERE spotify_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN artists.soundcloud_id IS 'SoundCloud username/permalink for the artist profile';
COMMENT ON COLUMN artists.spotify_id IS 'Spotify artist ID for the artist profile';

-- Add spotify_id and soundcloud_id columns to artist_registrations table
-- These are used for duplicate detection during registration
ALTER TABLE artist_registrations
ADD COLUMN IF NOT EXISTS spotify_id TEXT,
ADD COLUMN IF NOT EXISTS soundcloud_id TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_artist_registrations_spotify_id ON artist_registrations (spotify_id) WHERE spotify_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artist_registrations_soundcloud_id ON artist_registrations (soundcloud_id) WHERE soundcloud_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN artist_registrations.spotify_id IS 'Spotify artist ID for duplicate detection';
COMMENT ON COLUMN artist_registrations.soundcloud_id IS 'SoundCloud username/permalink for duplicate detection';
