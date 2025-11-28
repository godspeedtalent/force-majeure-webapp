-- Add about_event column to events table for the full event description (idempotent)
-- The existing description field will remain for the subtitle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'about_event'
  ) THEN
    ALTER TABLE events ADD COLUMN about_event TEXT;
  END IF;
END $$;