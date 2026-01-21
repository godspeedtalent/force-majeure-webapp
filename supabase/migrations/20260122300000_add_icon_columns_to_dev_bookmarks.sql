-- Migration: Add icon columns to dev_bookmarks table
-- Allows bookmarks to have custom icons with colors

-- Add icon column (name of the Lucide icon)
ALTER TABLE dev_bookmarks
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add icon_color column (hex color for the icon)
ALTER TABLE dev_bookmarks
ADD COLUMN IF NOT EXISTS icon_color TEXT;

-- Add comments explaining the columns
COMMENT ON COLUMN dev_bookmarks.icon IS 'Lucide icon name for the bookmark';
COMMENT ON COLUMN dev_bookmarks.icon_color IS 'Hex color for the bookmark icon';
