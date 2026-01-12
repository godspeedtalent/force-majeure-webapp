-- ============================================
-- Remove deprecated "coming_soon_mode" feature flag
-- ============================================
-- This flag was created in early migrations but is no longer used.
-- It's being removed to clean up the feature flags table.

DELETE FROM feature_flags WHERE flag_name = 'coming_soon_mode';
