-- Add group_name column to feature_flags table for grouping flags in the UI
-- Flags with the same group_name string will be displayed together

ALTER TABLE feature_flags
ADD COLUMN IF NOT EXISTS group_name TEXT DEFAULT 'general';

-- Add index for efficient grouping queries
CREATE INDEX IF NOT EXISTS idx_feature_flags_group_name ON feature_flags(group_name);

-- Update existing flags with logical groupings based on their names
-- Core flags
UPDATE feature_flags SET group_name = 'core' WHERE flag_name IN ('coming_soon_mode', 'demo_pages');

-- Event-related flags
UPDATE feature_flags SET group_name = 'events' WHERE flag_name IN ('event_checkout_timer', 'hero_image_horizontal_centering');

-- Social/community flags
UPDATE feature_flags SET group_name = 'social' WHERE flag_name IN ('scavenger_hunt', 'scavenger_hunt_active', 'show_leaderboard', 'member_profiles');

-- Store flags
UPDATE feature_flags SET group_name = 'store' WHERE flag_name IN ('merch_store');

-- Search flags
UPDATE feature_flags SET group_name = 'search' WHERE flag_name IN ('global_search');

-- Add comment for documentation
COMMENT ON COLUMN feature_flags.group_name IS 'Group name for UI display - flags with the same group_name are displayed together';
