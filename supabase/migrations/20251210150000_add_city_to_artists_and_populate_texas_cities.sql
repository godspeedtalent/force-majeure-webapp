-- Migration: Add city_id to artists table and populate Texas cities
-- Description: Adds city_id foreign key to artists table and populates cities table with Texas cities

-- ============================================================================
-- SECTION 1: Populate cities table with Texas cities
-- ============================================================================

-- Clear existing cities and insert Texas cities (alphabetical order)
DELETE FROM cities WHERE state = 'TX';

INSERT INTO cities (name, state) VALUES
  ('Austin', 'TX'),
  ('Dallas', 'TX'),
  ('Houston', 'TX'),
  ('San Antonio', 'TX'),
  ('San Marcos', 'TX')
ON CONFLICT (name, state) DO NOTHING;

-- ============================================================================
-- SECTION 2: Add city_id column to artists table
-- ============================================================================

-- Add city_id foreign key to artists table
ALTER TABLE artists
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_artists_city_id ON artists(city_id);

-- Add comment for documentation
COMMENT ON COLUMN artists.city_id IS 'Reference to the city where the artist is based';

-- ============================================================================
-- SECTION 3: Add city_id to artist_registrations table
-- ============================================================================

-- Add city_id foreign key to artist_registrations table
ALTER TABLE artist_registrations
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_artist_registrations_city_id ON artist_registrations(city_id);

-- Add comment for documentation
COMMENT ON COLUMN artist_registrations.city_id IS 'Reference to the city where the artist is based';

-- ============================================================================
-- SECTION 4: RLS Policies for cities (ensure they exist)
-- ============================================================================

-- Ensure cities are publicly viewable
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cities' AND policyname = 'Cities are publicly viewable'
  ) THEN
    CREATE POLICY "Cities are publicly viewable"
    ON cities
    FOR SELECT
    TO authenticated, anon
    USING (true);
  END IF;
END $$;
