-- Add logo_url column to venues table
-- This allows venues to have a separate logo/icon displayed alongside their name

ALTER TABLE venues
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN venues.logo_url IS 'URL to venue logo/icon image, displayed next to venue name';
