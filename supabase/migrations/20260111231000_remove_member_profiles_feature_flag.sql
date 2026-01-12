-- Migration: Remove member_profiles feature flag
-- Description: The member_profiles feature flag is no longer needed as profile pages are now always accessible.

-- Delete the member_profiles feature flag from all environments
DELETE FROM feature_flags
WHERE flag_name = 'member_profiles';

-- Add a comment for documentation
COMMENT ON TABLE feature_flags IS 'Feature flags for controlling feature availability. Note: member_profiles flag was removed in January 2026 as profiles are now always accessible.';
