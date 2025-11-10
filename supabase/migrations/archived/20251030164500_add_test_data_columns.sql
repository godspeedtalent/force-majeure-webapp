-- Add test_data boolean column to artists table
ALTER TABLE artists
ADD COLUMN IF NOT EXISTS test_data BOOLEAN NOT NULL DEFAULT false;

-- Add test_data boolean column to venues table
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS test_data BOOLEAN NOT NULL DEFAULT false;

-- Add test_data boolean column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS test_data BOOLEAN NOT NULL DEFAULT false;

-- Add indexes for querying test data
CREATE INDEX IF NOT EXISTS idx_artists_test_data ON artists(test_data);
CREATE INDEX IF NOT EXISTS idx_venues_test_data ON venues(test_data);
CREATE INDEX IF NOT EXISTS idx_events_test_data ON events(test_data);

-- Add comments for documentation
COMMENT ON COLUMN artists.test_data IS 'Indicates if this artist record was created for testing purposes';
COMMENT ON COLUMN venues.test_data IS 'Indicates if this venue record was created for testing purposes';
COMMENT ON COLUMN events.test_data IS 'Indicates if this event record was created for testing purposes';
