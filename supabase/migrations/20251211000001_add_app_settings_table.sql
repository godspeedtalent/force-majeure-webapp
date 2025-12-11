-- ============================================================================
-- Migration: Add app_settings table for global application configuration
-- ============================================================================

-- Create app_settings table for storing global configuration values
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  environment_id UUID NOT NULL REFERENCES environments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(setting_key, environment_id)
);

COMMENT ON TABLE app_settings IS 'Global application settings that can be configured per environment';
COMMENT ON COLUMN app_settings.setting_key IS 'Unique identifier for the setting (e.g., checkout_timer_default_minutes)';
COMMENT ON COLUMN app_settings.setting_value IS 'JSON value for the setting, allows flexible configuration';
COMMENT ON COLUMN app_settings.environment_id IS 'Environment this setting applies to';

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_app_settings_environment ON app_settings(environment_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "App settings are publicly viewable" ON app_settings;
DROP POLICY IF EXISTS "Admins can insert app settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can update app settings" ON app_settings;
DROP POLICY IF EXISTS "Admins can delete app settings" ON app_settings;

-- Anyone can read app settings (needed for checkout timer, etc.)
CREATE POLICY "App settings are publicly viewable"
  ON app_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert app settings"
  ON app_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can update app settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete app settings"
  ON app_settings FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- Grant permissions
GRANT SELECT ON TABLE public.app_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.app_settings TO authenticated;

-- Insert default checkout timer setting for 'all' environment
INSERT INTO app_settings (setting_key, setting_value, description, environment_id)
SELECT
  'checkout_timer_default_minutes',
  '{"value": 10}'::jsonb,
  'Default checkout timer duration in minutes when no per-event override exists',
  e.id
FROM environments e
WHERE e.name = 'all'
ON CONFLICT (setting_key, environment_id) DO NOTHING;