-- Add is_archived column to feature_flags table
-- This allows archiving feature flags that are no longer actively used
-- but should be retained for historical/reference purposes
ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Add index for filtering archived flags
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_archived ON feature_flags(is_archived);

-- Add comment for documentation
COMMENT ON COLUMN feature_flags.is_archived IS 'Whether this flag is archived - archived flags are hidden from main UI but retained for historical purposes';

-- Archive scavenger hunt related flags (no longer actively used)
UPDATE feature_flags SET is_archived = true WHERE flag_name IN ('scavenger_hunt', 'scavenger_hunt_active', 'show_leaderboard');

-- Move archived flags to 'archived' group
UPDATE feature_flags SET group_name = 'archived' WHERE is_archived = true;

-- Add organization_tools feature flag
INSERT INTO feature_flags (environment_id, flag_name, is_enabled, description, group_name)
SELECT
  e.id,
  'organization_tools',
  false,
  'Enables organization management tools and routes',
  'organization'
FROM environments e
WHERE e.name = 'all'
ON CONFLICT (environment_id, flag_name) DO NOTHING;
