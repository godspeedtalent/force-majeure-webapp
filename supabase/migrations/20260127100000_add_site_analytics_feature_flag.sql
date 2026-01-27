-- Add site_analytics feature flag for toggling the analytics system
-- This flag controls whether page views, sessions, Web Vitals, etc. are tracked
-- Useful for debugging performance issues potentially caused by analytics

-- Insert the site_analytics flag for each environment
-- Default to disabled (false) for debugging - enable when ready
DO $$
DECLARE
    env_record RECORD;
BEGIN
    FOR env_record IN SELECT id FROM environments
    LOOP
        INSERT INTO feature_flags (flag_name, is_enabled, environment_id, description, group_name)
        VALUES (
            'site_analytics',
            false,
            env_record.id,
            'Enables site-wide analytics tracking (page views, sessions, Web Vitals)',
            'analytics'
        )
        ON CONFLICT (flag_name, environment_id) DO NOTHING;
    END LOOP;
END $$;
