-- Add is_rsvp_only_event column to events table
-- When true, this event is RSVP-only (no paid tickets)

ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_rsvp_only_event BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN events.is_rsvp_only_event IS 'When true, this event only accepts RSVPs and has no paid ticket tiers';
