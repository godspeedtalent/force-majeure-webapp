-- Add validation_count column to track proxy token scans
ALTER TABLE public.scavenger_locations
ADD COLUMN validation_count INTEGER NOT NULL DEFAULT 0;

-- Add index for performance when querying by validation count
CREATE INDEX idx_scavenger_locations_validation_count ON public.scavenger_locations(validation_count);

-- Add comment to explain the column
COMMENT ON COLUMN public.scavenger_locations.validation_count IS 'Tracks the number of times this location has been validated via proxy token';
