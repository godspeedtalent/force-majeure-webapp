-- Simplify event view tracking: replace row-per-view with simple counter
-- This matches the pattern used for recording click tracking

-- Add view_count column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN events.view_count IS 'Cumulative page view count for this event';

-- Create index for sorting by popularity
CREATE INDEX IF NOT EXISTS idx_events_view_count ON events(view_count DESC);

-- Migrate existing counts from event_views table
UPDATE events e
SET view_count = (
  SELECT COUNT(*)::INTEGER
  FROM event_views ev
  WHERE ev.event_id = e.id
)
WHERE EXISTS (
  SELECT 1 FROM event_views ev WHERE ev.event_id = e.id
);

-- Create atomic increment function (matches increment_recording_click pattern)
CREATE OR REPLACE FUNCTION increment_event_view(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- Atomically increment view_count and return new value
  UPDATE events
  SET view_count = view_count + 1
  WHERE id = p_event_id
  RETURNING view_count INTO new_count;

  -- Return the new count (0 if event not found)
  RETURN COALESCE(new_count, 0);
END;
$$;

COMMENT ON FUNCTION increment_event_view IS 'Atomically increments the view count for an event and returns the new count.';

-- Grant execute to both authenticated and anonymous users (public event pages)
GRANT EXECUTE ON FUNCTION increment_event_view TO authenticated;
GRANT EXECUTE ON FUNCTION increment_event_view TO anon;

-- Update get_event_view_count to use the new column (for backwards compatibility)
CREATE OR REPLACE FUNCTION get_event_view_count(p_event_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(view_count, 0)::BIGINT
  FROM events
  WHERE id = p_event_id;
$$;

-- Drop old record_event_view function (no longer needed)
DROP FUNCTION IF EXISTS record_event_view(UUID, TEXT, INET, TEXT);

-- Note: Keeping event_views table for now as historical data
-- Can be dropped in a future migration after confirming no issues
