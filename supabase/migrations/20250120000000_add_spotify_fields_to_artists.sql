-- Add Spotify integration fields to artists table
-- This allows storing Spotify artist data when creating artists from Spotify search

-- Add spotify_id column to store Spotify artist ID for future reference
ALTER TABLE artists
ADD COLUMN IF NOT EXISTS spotify_id TEXT UNIQUE;

-- Add spotify_data column to cache Spotify metadata (followers, popularity, etc.)
ALTER TABLE artists
ADD COLUMN IF NOT EXISTS spotify_data JSONB;

-- Create index on spotify_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);

-- Add comment for documentation
COMMENT ON COLUMN artists.spotify_id IS 'Spotify artist ID for artists created from Spotify data';
COMMENT ON COLUMN artists.spotify_data IS 'Cached Spotify metadata (followers, popularity, external URLs, etc.)';
