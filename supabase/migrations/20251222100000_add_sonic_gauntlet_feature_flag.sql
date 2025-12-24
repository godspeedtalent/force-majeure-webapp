-- Add sonic_gauntlet feature flag for the DJ competition landing page
-- This flag controls visibility of the /sonic-gauntlet route

-- Insert the sonic_gauntlet flag for each environment
-- Using a DO block to handle the insert across all environments
DO $$
DECLARE
    env_record RECORD;
BEGIN
    FOR env_record IN SELECT id FROM environments
    LOOP
        INSERT INTO feature_flags (flag_name, is_enabled, environment_id, description, group_name)
        VALUES (
            'sonic_gauntlet',
            false,
            env_record.id,
            'Enables the Sonic Gauntlet DJ competition landing page at /sonic-gauntlet',
            'competitions'
        )
        ON CONFLICT (flag_name, environment_id) DO NOTHING;
    END LOOP;
END $$;
