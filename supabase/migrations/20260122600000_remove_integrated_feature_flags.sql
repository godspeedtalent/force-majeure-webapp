-- Migration: Remove integrated feature flags
-- These features are now fully integrated and no longer need feature flag gating:
-- - global_search: Global search functionality
-- - organization_tools: Organization management tools

-- Delete the feature flags from all environments
DELETE FROM feature_flags
WHERE flag_name IN ('global_search', 'organization_tools');
