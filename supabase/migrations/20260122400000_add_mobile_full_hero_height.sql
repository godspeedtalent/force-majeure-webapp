-- Add mobile_full_hero_height column to events table
-- This controls whether the hero image is displayed at full height on mobile
-- or cropped to a standard aspect ratio

ALTER TABLE events
ADD COLUMN IF NOT EXISTS mobile_full_hero_height BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN events.mobile_full_hero_height IS 'When true, displays the hero image at full height on mobile devices without cropping';
