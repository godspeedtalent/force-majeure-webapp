-- Add venue_id column to media_galleries to support venue-owned galleries
-- This allows venues to have their own galleries that are separate from global galleries

-- Add venue_id column (nullable to support global galleries)
ALTER TABLE media_galleries
ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id) ON DELETE CASCADE;

-- Add is_default column to mark the primary gallery for a venue
ALTER TABLE media_galleries
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Create index for faster venue gallery lookups
CREATE INDEX IF NOT EXISTS idx_media_galleries_venue_id ON media_galleries(venue_id);

-- Add unique constraint to ensure only one default gallery per venue
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_galleries_venue_default
ON media_galleries(venue_id)
WHERE is_default = TRUE;

-- Grant permissions for the new column
GRANT SELECT, INSERT, UPDATE ON media_galleries TO authenticated;

-- Add comment for documentation
COMMENT ON COLUMN media_galleries.venue_id IS 'The venue that owns this gallery. NULL for global galleries.';
COMMENT ON COLUMN media_galleries.is_default IS 'Whether this is the default gallery for the venue. Only one gallery per venue can be default.';
