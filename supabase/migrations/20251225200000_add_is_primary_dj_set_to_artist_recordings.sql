-- Add is_primary_dj_set column to artist_recordings table
-- This allows artists to designate one DJ set as their primary/featured set
-- which will be displayed prominently on their profile

ALTER TABLE artist_recordings
ADD COLUMN IF NOT EXISTS is_primary_dj_set BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN artist_recordings.is_primary_dj_set IS 'Indicates if this recording is the primary/featured DJ set for the artist. Only one DJ set per artist should have this set to true.';

-- Create a partial unique index to ensure only one primary DJ set per artist
-- This only applies to dj_set recordings where is_primary_dj_set is true
CREATE UNIQUE INDEX IF NOT EXISTS idx_artist_recordings_single_primary_dj_set
ON artist_recordings (artist_id)
WHERE recording_type = 'dj_set' AND is_primary_dj_set = true;
