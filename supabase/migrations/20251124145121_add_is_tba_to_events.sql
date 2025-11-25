-- Add is_tba column to events table
-- This allows events to be marked as TBA (To Be Announced) placeholders

ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_tba BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN events.is_tba IS 'Indicates if this event is a TBA (To Be Announced) placeholder. TBA events can still have venue and date assigned.';

-- Update existing events to ensure they have is_tba set to false
UPDATE events
SET is_tba = FALSE
WHERE is_tba IS NULL;
