-- Add conversion_funnel feature flag for the analytics conversion funnel tab
-- This flag controls visibility of the conversion funnel tab in site analytics

-- Insert the conversion_funnel flag for each environment
-- Using a DO block to handle the insert across all environments
DO $$
DECLARE
    env_record RECORD;
BEGIN
    FOR env_record IN SELECT id FROM environments
    LOOP
        INSERT INTO feature_flags (flag_name, is_enabled, environment_id, description, group_name)
        VALUES (
            'conversion_funnel',
            false,
            env_record.id,
            'Enables the conversion funnel analytics tab in site analytics dashboard',
            'analytics'
        )
        ON CONFLICT (flag_name, environment_id) DO NOTHING;
    END LOOP;
END $$;
