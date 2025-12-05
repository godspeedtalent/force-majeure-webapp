-- Migration: Add looking_for_undercard field to events
-- Description: Enables events to advertise they are looking for local artists to open

-- Add the column with a default of false
ALTER TABLE events
ADD COLUMN IF NOT EXISTS looking_for_undercard BOOLEAN NOT NULL DEFAULT false;

-- Add a comment explaining the field
COMMENT ON COLUMN events.looking_for_undercard IS 'When true, displays a "Looking for Artists" prompt in the event call times section';
