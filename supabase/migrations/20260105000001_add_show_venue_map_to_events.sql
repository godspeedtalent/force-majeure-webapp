-- Add show_venue_map column to events table
-- This controls whether the venue map is displayed on event pages/modals

ALTER TABLE events
ADD COLUMN IF NOT EXISTS show_venue_map BOOLEAN NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN events.show_venue_map IS 'Controls whether the venue location map is displayed on event pages and modals';
