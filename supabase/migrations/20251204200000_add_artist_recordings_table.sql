-- Create artist_recordings table to store linked tracks from Spotify/SoundCloud
CREATE TABLE IF NOT EXISTS artist_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  cover_art TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('spotify', 'soundcloud')),
  recording_type TEXT NOT NULL DEFAULT 'track' CHECK (recording_type IN ('track', 'dj_set')),
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate URLs for the same artist
  UNIQUE(artist_id, url)
);

-- Add index for faster lookups by artist
CREATE INDEX IF NOT EXISTS idx_artist_recordings_artist_id ON artist_recordings(artist_id);

-- Enable RLS
ALTER TABLE artist_recordings ENABLE ROW LEVEL SECURITY;

-- Anyone can view recordings (public data)
CREATE POLICY "Artist recordings are viewable by everyone"
  ON artist_recordings FOR SELECT
  USING (true);

-- Admins, org admins, and developers can manage all recordings
CREATE POLICY "Admins can manage recordings"
  ON artist_recordings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'org_admin', 'developer')
    )
  );

-- TODO: When artists table gets a user_id column, add policy for artists to manage their own recordings:
-- CREATE POLICY "Artists can manage their own recordings"
--   ON artist_recordings FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM artists a
--       WHERE a.id = artist_recordings.artist_id
--       AND a.user_id = auth.uid()
--     )
--   );

-- Add comment for documentation
COMMENT ON TABLE artist_recordings IS 'Stores linked music tracks (Spotify/SoundCloud) for artists';
