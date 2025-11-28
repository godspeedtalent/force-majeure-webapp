-- Create user_event_interests junction table
CREATE TABLE user_event_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_user_event_interests_event_id ON user_event_interests(event_id);
CREATE INDEX idx_user_event_interests_user_id ON user_event_interests(user_id);
CREATE INDEX idx_user_event_interests_created_at ON user_event_interests(created_at DESC);

-- Enable RLS
ALTER TABLE user_event_interests ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access" ON user_event_interests
  FOR SELECT USING (true);

-- Authenticated users can insert own interests
CREATE POLICY "Authenticated users can insert own interests" ON user_event_interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete own interests
CREATE POLICY "Users can delete own interests" ON user_event_interests
  FOR DELETE USING (auth.uid() = user_id);

-- Add threshold columns to events table
ALTER TABLE events
  ADD COLUMN min_interest_count_display INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN min_share_count_display INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN events.min_interest_count_display IS
  'Minimum interest count required to display count publicly';
COMMENT ON COLUMN events.min_share_count_display IS
  'Minimum share count required to display count publicly';

-- Create RPC functions
CREATE OR REPLACE FUNCTION get_event_interest_count(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM user_event_interests
    WHERE event_id = p_event_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION is_user_interested(p_user_id UUID, p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_event_interests
    WHERE user_id = p_user_id AND event_id = p_event_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_event_interest_count TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_user_interested TO authenticated, anon;