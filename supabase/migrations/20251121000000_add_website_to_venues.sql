-- Add website column to venues table
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add comment
COMMENT ON COLUMN venues.website IS 'Venue or company website URL';
