-- Add no_headliner column to events table
-- When true, all artists are undercard artists with no featured headliner

ALTER TABLE events
ADD COLUMN IF NOT EXISTS no_headliner BOOLEAN DEFAULT FALSE;

-- Add comment explaining the column
COMMENT ON COLUMN events.no_headliner IS 'When true, the event has no headliner and all artists are listed as undercard artists';

-- Create index for potential filtering
CREATE INDEX IF NOT EXISTS idx_events_no_headliner ON events(no_headliner) WHERE no_headliner = TRUE;
