-- Create function to atomically increment event share count
-- This ensures thread-safe increments when multiple users share simultaneously
-- Note: Using p_event_id to match the existing function signature

CREATE OR REPLACE FUNCTION increment_event_share_count(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- Atomically increment share_count and return new value
  UPDATE events
  SET share_count = share_count + 1
  WHERE id = p_event_id
  RETURNING share_count INTO new_count;

  -- Return the new count
  RETURN COALESCE(new_count, 0);
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION increment_event_share_count IS 'Atomically increments the share count for an event and returns the new count';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_event_share_count TO authenticated;

-- Also allow anonymous users to share (public events)
GRANT EXECUTE ON FUNCTION increment_event_share_count TO anon;
