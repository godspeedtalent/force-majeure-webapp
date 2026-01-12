-- Migration: Remove event_checkout_timer feature flag
-- Description: The event_checkout_timer feature flag is no longer needed as timer functionality is now controlled per-event.

-- Delete the event_checkout_timer feature flag from all environments
DELETE FROM feature_flags
WHERE flag_name = 'event_checkout_timer';

-- Add a comment for documentation
COMMENT ON TABLE feature_flags IS 'Feature flags for controlling feature availability. Note: event_checkout_timer flag was removed in January 2026 as timer is now controlled per-event.';
