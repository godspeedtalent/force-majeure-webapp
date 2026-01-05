-- Add description column to venues table
-- This allows venues to have descriptive text shown in modals and detail pages

ALTER TABLE venues
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN venues.description IS 'Description text for the venue, shown in venue details modals and pages';
