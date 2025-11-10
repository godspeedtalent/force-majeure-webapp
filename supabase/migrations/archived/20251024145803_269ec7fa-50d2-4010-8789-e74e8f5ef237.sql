-- Add music_player and scavenger_hunt feature flags
INSERT INTO public.feature_flags (flag_name, is_enabled, environment, description)
VALUES 
  ('music_player', false, 'all', 'Enable/disable the music player component'),
  ('scavenger_hunt', false, 'all', 'Enable/disable the scavenger hunt feature')
ON CONFLICT (flag_name) DO NOTHING;