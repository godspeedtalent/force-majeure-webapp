-- Insert new feature flags with descriptions
INSERT INTO public.feature_flags (flag_name, is_enabled, environment, description)
VALUES 
  ('merch_store', false, 'all', 'Enables navigation to the merchandise store'),
  ('member_profiles', false, 'all', 'Enables navigation to member profile pages at /members/home')
ON CONFLICT (flag_name) DO NOTHING;

-- Update existing feature flags with descriptions
UPDATE public.feature_flags
SET description = CASE flag_name
  WHEN 'music_player' THEN 'Enables the global music player interface'
  WHEN 'event_checkout_timer' THEN 'Shows countdown timer during event checkout process'
  WHEN 'scavenger_hunt' THEN 'Enables the scavenger hunt feature and navigation'
  WHEN 'coming_soon_mode' THEN 'Displays coming soon page for all routes except auth and scavenger'
  ELSE description
END
WHERE description IS NULL OR description = '';