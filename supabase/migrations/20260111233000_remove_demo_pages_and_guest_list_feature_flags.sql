-- Migration: Remove demo_pages and guest_list feature flags
-- Description:
--   - demo_pages: No longer needed as demo pages are now always accessible to authorized users
--   - guest_list: No longer needed as guest list is now controlled per-event in guest_list_settings table

-- Delete the demo_pages feature flag from all environments
DELETE FROM feature_flags
WHERE flag_name = 'demo_pages';

-- Delete the guest_list feature flag from all environments
DELETE FROM feature_flags
WHERE flag_name = 'guest_list';

-- Add a comment for documentation
COMMENT ON TABLE feature_flags IS 'Feature flags for controlling feature availability. Note: demo_pages and guest_list flags were removed in January 2026 - demo pages are always accessible to authorized users, guest list is controlled per-event.';
