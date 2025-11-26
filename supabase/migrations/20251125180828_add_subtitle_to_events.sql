-- Add subtitle column to events table
-- This migration adds a dedicated subtitle field for events,
-- separate from the description field which is used for "About This Event"

-- Add the subtitle column
ALTER TABLE events
ADD COLUMN subtitle TEXT;

-- Add comment for documentation
COMMENT ON COLUMN events.subtitle IS 'Short subtitle for the event, displayed prominently (separate from full description)';
