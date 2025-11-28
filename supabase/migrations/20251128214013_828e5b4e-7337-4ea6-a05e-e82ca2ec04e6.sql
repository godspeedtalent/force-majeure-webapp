-- Add share_count column to events table
ALTER TABLE events
  ADD COLUMN share_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN events.share_count IS 'Number of times this event has been shared';

-- Create function to increment share count
CREATE OR REPLACE FUNCTION increment_event_share_count(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  UPDATE events
  SET share_count = share_count + 1
  WHERE id = p_event_id
  RETURNING share_count INTO v_new_count;
  
  RETURN v_new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_event_share_count TO authenticated, anon;