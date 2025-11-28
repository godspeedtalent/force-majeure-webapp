-- Add share_count column to events table
-- This tracks how many times an event has been shared

ALTER TABLE events
ADD COLUMN IF NOT EXISTS share_count INTEGER NOT NULL DEFAULT 0;

-- Add index for efficient querying by share count (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_events_share_count ON events(share_count DESC);

-- Add comment for documentation
COMMENT ON COLUMN events.share_count IS 'Number of times this event has been shared via the share button';
