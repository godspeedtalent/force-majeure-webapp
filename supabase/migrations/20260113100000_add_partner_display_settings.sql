-- Migration: Add partner and guest list display settings
-- Date: 2025-01-13
-- Description: Add display toggles for partners and guest list on events, and individual hide toggle on event_partners

-- Add display settings to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS show_partners BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS show_guest_list BOOLEAN NOT NULL DEFAULT true;

-- Add is_hidden column to event_partners for individual partner visibility
ALTER TABLE event_partners
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN events.show_partners IS 'Whether to display partner organizations on the event page';
COMMENT ON COLUMN events.show_guest_list IS 'Whether to display guest list section on the event page';
COMMENT ON COLUMN event_partners.is_hidden IS 'Whether this partner is hidden from the event page (individually hidden)';
