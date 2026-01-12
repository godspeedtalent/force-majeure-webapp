-- ============================================
-- ADD COUNTRY TO VENUES
-- ============================================
--
-- Venues were missing the country field. This adds it for consistency
-- with other address-storing entities. Venues stay denormalized since
-- they represent fixed physical locations.
--

-- Add country column to venues
ALTER TABLE venues ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';

-- Add constraint for country format (2-letter ISO code)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'venues_country_format'
  ) THEN
    ALTER TABLE venues ADD CONSTRAINT venues_country_format
      CHECK (country IS NULL OR length(country) = 2);
  END IF;
END $$;

-- Update existing venues to have US as default (if any have NULL)
UPDATE venues SET country = 'US' WHERE country IS NULL;

-- Add comment
COMMENT ON COLUMN venues.country IS 'Two-letter ISO country code (e.g., US, CA, MX). Defaults to US.';
