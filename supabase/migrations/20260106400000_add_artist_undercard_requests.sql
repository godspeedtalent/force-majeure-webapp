-- Migration: Enhance undercard_requests to support linked artists and suggested recordings
-- Description: Adds artist_id column for users with linked artists, and suggested_recording_id for DJs to suggest a set

-- Add artist_id column for users who have a linked artist (not just artist registrations)
ALTER TABLE undercard_requests
ADD COLUMN IF NOT EXISTS artist_id UUID REFERENCES artists(id) ON DELETE CASCADE;

-- Add suggested_recording_id for artists to suggest a DJ set to listen to
ALTER TABLE undercard_requests
ADD COLUMN IF NOT EXISTS suggested_recording_id UUID REFERENCES artist_recordings(id) ON DELETE SET NULL;

-- Make artist_registration_id optional (either artist_id or artist_registration_id must be set)
ALTER TABLE undercard_requests
ALTER COLUMN artist_registration_id DROP NOT NULL;

-- Add check constraint to ensure either artist_id or artist_registration_id is set
ALTER TABLE undercard_requests
ADD CONSTRAINT undercard_requests_artist_check
CHECK (artist_id IS NOT NULL OR artist_registration_id IS NOT NULL);

-- Drop the old unique constraint and add a new one that accounts for both types
ALTER TABLE undercard_requests
DROP CONSTRAINT IF EXISTS undercard_requests_event_id_artist_registration_id_key;

-- Create unique indexes for both scenarios
CREATE UNIQUE INDEX IF NOT EXISTS idx_undercard_requests_event_artist
ON undercard_requests(event_id, artist_id)
WHERE artist_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_undercard_requests_event_registration
ON undercard_requests(event_id, artist_registration_id)
WHERE artist_registration_id IS NOT NULL;

-- Add index for suggested_recording_id
CREATE INDEX IF NOT EXISTS idx_undercard_requests_suggested_recording
ON undercard_requests(suggested_recording_id)
WHERE suggested_recording_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN undercard_requests.artist_id IS 'Reference to linked artist for users with existing artist profiles';
COMMENT ON COLUMN undercard_requests.suggested_recording_id IS 'Optional DJ set recording suggested by the artist for reviewers to listen to';

-- Grant permissions (RLS policies already exist)
GRANT INSERT, UPDATE, DELETE ON TABLE public.undercard_requests TO authenticated;
