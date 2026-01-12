-- Migration: Remove member_profiles feature flag
-- The member profiles feature is now always enabled - no flag gating needed

DELETE FROM feature_flags WHERE flag_name = 'member_profiles';
