-- Migration: Create dev_bookmarks table for developer page bookmarks
-- Allows developers to bookmark pages for quick navigation

-- ============================================
-- DEV_BOOKMARKS - Create table with RLS
-- ============================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS dev_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Ensure unique path per user
  CONSTRAINT unique_user_bookmark_path UNIQUE (user_id, path)
);

-- Add comment explaining the table
COMMENT ON TABLE dev_bookmarks IS 'Developer page bookmarks for quick navigation in the dev toolbar';

-- 2. Create indexes
CREATE INDEX idx_dev_bookmarks_user_id ON dev_bookmarks(user_id);
CREATE INDEX idx_dev_bookmarks_created_at ON dev_bookmarks(created_at DESC);

-- 3. Enable RLS
ALTER TABLE dev_bookmarks ENABLE ROW LEVEL SECURITY;

-- 4. Grant permissions (authenticated users only, no anonymous access)
GRANT SELECT, INSERT, UPDATE, DELETE ON dev_bookmarks TO authenticated;

-- 5. RLS Policies

-- Users can view their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON dev_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own bookmarks (developer/admin only)
CREATE POLICY "Developers can insert bookmarks"
  ON dev_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      is_dev_admin(auth.uid())
    )
  );

-- Users can update their own bookmarks
CREATE POLICY "Users can update own bookmarks"
  ON dev_bookmarks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
  ON dev_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all bookmarks (for debugging)
CREATE POLICY "Admins can view all bookmarks"
  ON dev_bookmarks FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    is_dev_admin(auth.uid())
  );

-- 6. Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dev_bookmarks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dev_bookmarks_updated_at
  BEFORE UPDATE ON dev_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_dev_bookmarks_updated_at();
