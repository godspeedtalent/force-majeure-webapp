-- Add spotify_integration feature flag (disabled by default)
-- Use INSERT ... ON CONFLICT to handle existing flags gracefully
INSERT INTO public.feature_flags (flag_name, is_enabled, description, environment, disabled)
VALUES ('spotify_integration', false, 'Enable Spotify integration and authentication features', 'all', false)
ON CONFLICT (flag_name) DO NOTHING;
