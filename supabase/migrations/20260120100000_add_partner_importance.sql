-- Migration: Add importance column to event_partners
-- Date: 2025-01-20
-- Description: Add importance field to control sponsor sizing/prominence in display grid
-- Importance determines how many grid columns a partner spans (1-3)

-- Add importance column to event_partners table
ALTER TABLE event_partners
ADD COLUMN IF NOT EXISTS importance INTEGER NOT NULL DEFAULT 1
  CHECK (importance >= 1 AND importance <= 3);

-- Add comment for documentation
COMMENT ON COLUMN event_partners.importance IS 'Display importance (1-3). Higher values make the partner span more columns in the grid display. 1=normal, 2=featured (2 columns), 3=primary sponsor (3 columns)';
