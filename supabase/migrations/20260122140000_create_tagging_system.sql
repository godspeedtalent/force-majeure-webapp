-- ============================================================================
-- UNIVERSAL TAGGING SYSTEM
-- ============================================================================
-- Created: 2026-01-22
-- Purpose: Universal tagging system for any entity with optional entity_type filtering
-- ============================================================================

-- Universal tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  entity_type TEXT CHECK (entity_type IN ('submission', 'event', 'artist', 'venue', 'order')),
  color TEXT,
  description TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tag_name_min_length CHECK (char_length(name) >= 2),
  CONSTRAINT tag_name_max_length CHECK (char_length(name) <= 50)
);

COMMENT ON TABLE tags IS 'Universal tagging system. entity_type null = universal tag (can be used anywhere), non-null = filtered to specific entity types.';
COMMENT ON COLUMN tags.entity_type IS 'Optional filter: null allows tag for all entities, non-null restricts to specific entity type(s)';
COMMENT ON COLUMN tags.usage_count IS 'Denormalized count of how many times this tag is used (updated via triggers)';

-- Indexes for performance
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_entity_type ON tags(entity_type) WHERE entity_type IS NOT NULL;
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX idx_tags_name_trgm ON tags USING gin(name gin_trgm_ops);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- GRANTs
GRANT SELECT ON tags TO authenticated;
GRANT SELECT ON tags TO anon;
GRANT INSERT, UPDATE, DELETE ON tags TO authenticated;

-- RLS Policies
CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators and admins can update tags"
  ON tags FOR UPDATE
  USING (
    created_by = auth.uid() OR
    has_role(auth.uid(), 'admin') OR
    is_dev_admin(auth.uid())
  );

CREATE POLICY "Admins can delete tags"
  ON tags FOR DELETE
  USING (
    has_role(auth.uid(), 'admin') OR
    is_dev_admin(auth.uid())
  );

-- ============================================================================
-- SUBMISSION TAGS JUNCTION TABLE
-- ============================================================================

CREATE TABLE submission_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES screening_submissions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  tagged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  tagged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_submission_tag UNIQUE (submission_id, tag_id)
);

COMMENT ON TABLE submission_tags IS 'Tags applied to screening submissions. Many-to-many relationship.';

-- Indexes
CREATE INDEX idx_submission_tags_submission ON submission_tags(submission_id);
CREATE INDEX idx_submission_tags_tag ON submission_tags(tag_id);
CREATE INDEX idx_submission_tags_tagged_by ON submission_tags(tagged_by);

-- Enable RLS
ALTER TABLE submission_tags ENABLE ROW LEVEL SECURITY;

-- GRANTs
GRANT SELECT ON submission_tags TO authenticated;
GRANT SELECT ON submission_tags TO anon;
GRANT INSERT, DELETE ON submission_tags TO authenticated;

-- RLS Policies
CREATE POLICY "Anyone can view submission tags"
  ON submission_tags FOR SELECT
  USING (true);

CREATE POLICY "Staff can tag submissions"
  ON submission_tags FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'fm_staff') OR
    has_role(auth.uid(), 'admin') OR
    is_dev_admin(auth.uid())
  );

CREATE POLICY "Staff can remove submission tags"
  ON submission_tags FOR DELETE
  USING (
    has_role(auth.uid(), 'fm_staff') OR
    has_role(auth.uid(), 'admin') OR
    is_dev_admin(auth.uid())
  );

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger on submission_tags
CREATE TRIGGER update_tag_usage_on_submission_tags
AFTER INSERT OR DELETE ON submission_tags
FOR EACH ROW
EXECUTE FUNCTION update_tag_usage_count();

-- Update timestamp trigger for tags
CREATE TRIGGER set_timestamp_tags
BEFORE UPDATE ON tags
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- USER IGNORED SUBMISSIONS (PER-USER HIDE FEATURE)
-- ============================================================================

CREATE TABLE user_ignored_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES screening_submissions(id) ON DELETE CASCADE,
  ignored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_ignored_submission UNIQUE (user_id, submission_id)
);

COMMENT ON TABLE user_ignored_submissions IS 'Per-user ignored submissions. Allows users to hide unwanted submissions from their feed.';

-- Indexes
CREATE INDEX idx_user_ignored_submissions_user ON user_ignored_submissions(user_id);
CREATE INDEX idx_user_ignored_submissions_submission ON user_ignored_submissions(submission_id);

-- Enable RLS
ALTER TABLE user_ignored_submissions ENABLE ROW LEVEL SECURITY;

-- GRANTs
GRANT SELECT, INSERT, DELETE ON user_ignored_submissions TO authenticated;

-- RLS Policies
CREATE POLICY "Users can view their own ignored submissions"
  ON user_ignored_submissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can ignore submissions"
  ON user_ignored_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unignore their submissions"
  ON user_ignored_submissions FOR DELETE
  USING (user_id = auth.uid());
