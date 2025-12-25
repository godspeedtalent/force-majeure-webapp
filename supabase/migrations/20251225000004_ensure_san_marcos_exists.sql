-- Migration: Ensure San Marcos exists in cities table
-- Description: Adds San Marcos, TX if it doesn't already exist

-- Insert San Marcos if it doesn't exist
INSERT INTO cities (name, state)
VALUES ('San Marcos', 'TX')
ON CONFLICT (name, state) DO NOTHING;
