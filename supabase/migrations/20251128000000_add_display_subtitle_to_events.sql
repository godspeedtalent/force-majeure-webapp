-- Migration: Add display_subtitle field to events table
-- Purpose: Control whether subtitle is displayed on homepage event cards

ALTER TABLE events
ADD COLUMN IF NOT EXISTS display_subtitle BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN events.display_subtitle IS 'Whether to display the event subtitle on homepage event cards';
