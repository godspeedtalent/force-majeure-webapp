-- Add title and rich text content columns to dev_notes
-- The content column stores TipTap JSON format for rich text

ALTER TABLE dev_notes
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS content JSONB;

-- Add index for searching by title
CREATE INDEX IF NOT EXISTS idx_dev_notes_title ON dev_notes (title);

-- Comment on new columns
COMMENT ON COLUMN dev_notes.title IS 'Optional title for the note';
COMMENT ON COLUMN dev_notes.content IS 'Rich text content in TipTap JSON format';