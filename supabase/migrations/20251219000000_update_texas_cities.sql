-- Migration: Update Texas cities to only include Austin, San Marcos, and Houston
-- Description: Removes Dallas and San Antonio, keeps only Austin, San Marcos, and Houston

-- ============================================================================
-- SECTION 1: Remove unused cities (Dallas, San Antonio)
-- ============================================================================

-- First, set any artist city_id references to NULL if they reference cities being removed
UPDATE artists
SET city_id = NULL
WHERE city_id IN (
  SELECT id FROM cities WHERE state = 'TX' AND name IN ('Dallas', 'San Antonio')
);

UPDATE artist_registrations
SET city_id = NULL
WHERE city_id IN (
  SELECT id FROM cities WHERE state = 'TX' AND name IN ('Dallas', 'San Antonio')
);

-- Remove the cities
DELETE FROM cities WHERE state = 'TX' AND name IN ('Dallas', 'San Antonio');

-- Verify only the three allowed cities remain
-- Final cities: Austin, TX; Houston, TX; San Marcos, TX