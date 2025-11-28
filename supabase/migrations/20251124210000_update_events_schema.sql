-- Update events table schema to use proper date/time types
-- This migration fixes the schema mismatch between database and application code

-- Step 1: Rename 'name' column to 'title' (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'name'
  ) THEN
    ALTER TABLE events RENAME COLUMN name TO title;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN events.title IS 'Display title for the event (e.g., "Artist Name @ Venue Name")';

-- Step 2: Change start_time from TEXT to TIMESTAMPTZ (if needed)
DO $$
BEGIN
  -- Only convert if start_time is TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'start_time'
    AND data_type = 'text'
  ) THEN
    -- Create a temporary column
    ALTER TABLE events ADD COLUMN start_time_new TIMESTAMPTZ;

    -- Try to convert existing TEXT values to TIMESTAMPTZ
    UPDATE events
    SET start_time_new = CASE
      WHEN start_time IS NOT NULL AND start_time != '' THEN
        CASE
          -- ISO format with T
          WHEN start_time ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}' THEN start_time::TIMESTAMPTZ
          -- Space separated format
          WHEN start_time ~ '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}' THEN start_time::TIMESTAMPTZ
          ELSE NULL
        END
      ELSE NULL
    END;

    -- Drop old column and rename new one
    ALTER TABLE events DROP COLUMN start_time;
    ALTER TABLE events RENAME COLUMN start_time_new TO start_time;
  END IF;
END $$;

-- Step 3: Change end_time from TEXT to TIMESTAMPTZ (if needed)
DO $$
BEGIN
  -- Only convert if end_time is TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'end_time'
    AND data_type = 'text'
  ) THEN
    -- Create a temporary column
    ALTER TABLE events ADD COLUMN end_time_new TIMESTAMPTZ;

    -- Try to convert existing TEXT values to TIMESTAMPTZ
    UPDATE events
    SET end_time_new = CASE
      WHEN end_time IS NOT NULL AND end_time != '' THEN
        CASE
          -- ISO format with T
          WHEN end_time ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}' THEN end_time::TIMESTAMPTZ
          -- Space separated format
          WHEN end_time ~ '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}' THEN end_time::TIMESTAMPTZ
          -- Time only (e.g., "02:00") - this will fail, set to NULL
          ELSE NULL
        END
      ELSE NULL
    END;

    -- Drop old column and rename new one
    ALTER TABLE events DROP COLUMN end_time;
    ALTER TABLE events RENAME COLUMN end_time_new TO end_time;
  END IF;
END $$;

-- Update comments
COMMENT ON COLUMN events.start_time IS 'Event start date and time (TIMESTAMPTZ)';
COMMENT ON COLUMN events.end_time IS 'Event end date and time (TIMESTAMPTZ). NULL when is_after_hours is true';

-- Add index for better query performance on start_time
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
