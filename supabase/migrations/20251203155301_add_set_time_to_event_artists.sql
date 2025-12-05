-- Add set_time column to event_artists table for individual artist schedule times
-- This allows storing the actual set/performance time for each artist at an event

ALTER TABLE event_artists
ADD COLUMN set_time TIMESTAMPTZ NULL;

-- Add set_order column for ordering artists in the lineup
ALTER TABLE event_artists
ADD COLUMN set_order INTEGER NULL;

-- Add a comment explaining the columns
COMMENT ON COLUMN event_artists.set_time IS 'The scheduled performance/set time for this artist at this event';
COMMENT ON COLUMN event_artists.set_order IS 'The order in which this artist appears in the lineup (1 = first, etc.)';

-- Create an index for efficient querying of artists by event ordered by set_time
CREATE INDEX idx_event_artists_set_time ON event_artists (event_id, set_time);
CREATE INDEX idx_event_artists_set_order ON event_artists (event_id, set_order);
