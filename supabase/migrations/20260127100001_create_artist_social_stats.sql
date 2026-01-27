-- Migration: Create artist_social_stats table for Delphi forecasting
-- This table stores social media statistics for artists, separate from the main artists table
-- to keep it clean and allow for future expansion (historical tracking, more platforms)

-- Create the table
CREATE TABLE IF NOT EXISTS artist_social_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,

  -- Spotify metrics (manual entry for local/regional, auto-fetch for global)
  spotify_local_listeners INTEGER,
  spotify_regional_listeners INTEGER,
  spotify_followers INTEGER,

  -- Other platforms
  soundcloud_followers INTEGER,
  instagram_followers INTEGER,
  tiktok_followers INTEGER,

  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One stats record per artist (upsert pattern)
  UNIQUE(artist_id)
);

-- Index for fast lookups by artist
CREATE INDEX IF NOT EXISTS idx_artist_social_stats_artist_id
  ON artist_social_stats(artist_id);

-- Enable Row Level Security
ALTER TABLE artist_social_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Anyone can read artist stats" ON artist_social_stats;

DROP POLICY IF EXISTS "Admins and developers can manage stats" ON artist_social_stats;

-- Anyone can read artist stats (public data)
CREATE POLICY "Anyone can read artist stats"
  ON artist_social_stats FOR SELECT
  USING (true);

-- Admins and developers can insert/update/delete stats
CREATE POLICY "Admins and developers can manage stats"
  ON artist_social_stats FOR ALL
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

-- Grants (idempotent)
GRANT SELECT ON artist_social_stats TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON artist_social_stats TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE artist_social_stats IS 'Social media statistics for artists, used by Delphi forecasting tool. Supports both auto-fetched (Spotify, SoundCloud) and manually entered (Instagram, TikTok, regional listeners) data.';
