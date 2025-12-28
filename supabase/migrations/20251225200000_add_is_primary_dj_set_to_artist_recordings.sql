-- Add is_primary_dj_set column to artist_recordings table
-- This allows artists to designate one DJ set as their primary/featured set
-- which will be displayed prominently on their profile

-- Only run if artist_recordings table exists with the required columns
DO $$
BEGIN
  -- Check if artist_recordings table exists
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'artist_recordings'
  ) THEN
    -- Add is_primary_dj_set column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'artist_recordings'
      AND column_name = 'is_primary_dj_set'
    ) THEN
      ALTER TABLE artist_recordings
      ADD COLUMN is_primary_dj_set BOOLEAN NOT NULL DEFAULT false;

      COMMENT ON COLUMN artist_recordings.is_primary_dj_set IS
        'Indicates if this recording is the primary/featured DJ set for the artist. Only one DJ set per artist should have this set to true.';
    END IF;

    -- Create partial unique index only if recording_type column exists
    -- This ensures only one primary DJ set per artist
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'artist_recordings'
      AND column_name = 'recording_type'
    ) THEN
      IF NOT EXISTS (
        SELECT FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname = 'idx_artist_recordings_single_primary_dj_set'
      ) THEN
        CREATE UNIQUE INDEX idx_artist_recordings_single_primary_dj_set
        ON artist_recordings (artist_id)
        WHERE recording_type = 'dj_set' AND is_primary_dj_set = true;
      END IF;
    END IF;
  END IF;
END $$;
