-- Create recording_ratings table for internal DJ vetting system
-- Only developers and admins can rate recordings

CREATE TABLE IF NOT EXISTS recording_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES artist_recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Enforce one rating per user per recording (upsert behavior)
  UNIQUE(recording_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_recording_ratings_recording_id ON recording_ratings(recording_id);
CREATE INDEX IF NOT EXISTS idx_recording_ratings_user_id ON recording_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_recording_ratings_score ON recording_ratings(score);

-- Enable RLS
ALTER TABLE recording_ratings ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON recording_ratings TO authenticated;

-- RLS Policies: Only admins and developers can interact with ratings

-- Select: Admins and developers can view all ratings
CREATE POLICY "Admins and developers can view ratings"
  ON recording_ratings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  );

-- Insert: Admins and developers can create ratings (only for themselves)
CREATE POLICY "Admins and developers can create ratings"
  ON recording_ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  );

-- Update: Users can only update their own ratings (if admin/developer)
CREATE POLICY "Users can update own ratings"
  ON recording_ratings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  );

-- Delete: Users can delete their own ratings (if admin/developer)
CREATE POLICY "Users can delete own ratings"
  ON recording_ratings FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  );

-- Add comment for documentation
COMMENT ON TABLE recording_ratings IS 'Internal rating system for DJ recordings, restricted to admins and developers for vetting purposes';
