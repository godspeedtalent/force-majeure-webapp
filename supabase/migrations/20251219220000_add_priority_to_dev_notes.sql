-- Add priority column to dev_notes table
-- This allows users to set a custom priority for their dev notes

ALTER TABLE dev_notes
ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 3;

-- Add constraint to ensure priority is within valid range (1-5, where 1 is highest)
ALTER TABLE dev_notes
ADD CONSTRAINT dev_notes_priority_range CHECK (priority >= 1 AND priority <= 5);

-- Add index for efficient sorting by priority
CREATE INDEX IF NOT EXISTS idx_dev_notes_priority ON dev_notes(priority ASC, created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN dev_notes.priority IS 'User-defined priority level: 1 (highest) to 5 (lowest), default is 3 (medium)';
