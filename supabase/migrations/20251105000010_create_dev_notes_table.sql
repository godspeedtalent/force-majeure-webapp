-- Create dev_notes table for developer TODO/notes feature
CREATE TABLE IF NOT EXISTS dev_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('TODO', 'INFO', 'BUG', 'QUESTION')),
  status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'ARCHIVED', 'RESOLVED', 'CANCELLED'))
);

-- Create index on author_id for faster queries
CREATE INDEX idx_dev_notes_author_id ON dev_notes(author_id);

-- Create index on status for filtering
CREATE INDEX idx_dev_notes_status ON dev_notes(status);

-- Create index on type for filtering
CREATE INDEX idx_dev_notes_type ON dev_notes(type);

-- Create index on created_at for sorting
CREATE INDEX idx_dev_notes_created_at ON dev_notes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE dev_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Developers can read all notes
CREATE POLICY "Developers can view all dev notes"
  ON dev_notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('developer', 'admin')
    )
  );

-- Policy: Developers can create notes
CREATE POLICY "Developers can create dev notes"
  ON dev_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('developer', 'admin')
    )
    AND author_id = auth.uid()
  );

-- Policy: Developers can update their own notes
CREATE POLICY "Developers can update their own dev notes"
  ON dev_notes
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('developer', 'admin')
    )
  )
  WITH CHECK (
    author_id = auth.uid()
  );

-- Policy: Developers can delete their own notes
CREATE POLICY "Developers can delete their own dev notes"
  ON dev_notes
  FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_name IN ('developer', 'admin')
    )
  );

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dev_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dev_notes_updated_at
  BEFORE UPDATE ON dev_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_dev_notes_updated_at();
