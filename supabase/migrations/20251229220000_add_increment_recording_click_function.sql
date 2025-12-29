-- Create function to atomically increment recording click count
-- This ensures thread-safe increments when multiple users click simultaneously
-- Used by FmRecordingLink component for centralized click tracking

CREATE OR REPLACE FUNCTION increment_recording_click(recording_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- Atomically increment click_count and return new value
  UPDATE artist_recordings
  SET click_count = click_count + 1
  WHERE id = recording_id
  RETURNING click_count INTO new_count;

  -- Return the new count (0 if recording not found)
  RETURN COALESCE(new_count, 0);
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION increment_recording_click IS 'Atomically increments the click count for a recording and returns the new count. Used for tracking external link clicks to Spotify/SoundCloud.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_recording_click TO authenticated;

-- Also allow anonymous users to click (public artist pages)
GRANT EXECUTE ON FUNCTION increment_recording_click TO anon;
