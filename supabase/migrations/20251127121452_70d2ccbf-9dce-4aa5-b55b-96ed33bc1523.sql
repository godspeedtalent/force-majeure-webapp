-- Add hero_image_horizontal_centering feature flag (disabled by default, idempotent)
INSERT INTO feature_flags (environment_id, flag_name, is_enabled, description)
SELECT
  e.id,
  'hero_image_horizontal_centering',
  false,
  'Enables focal point control for hero image horizontal rendering'
FROM environments e
WHERE e.name IN ('dev', 'staging', 'production')
ON CONFLICT (environment_id, flag_name) DO NOTHING;
