-- Add about_event column to events table for the full event description
-- The existing description field will remain for the subtitle
ALTER TABLE events ADD COLUMN about_event TEXT;