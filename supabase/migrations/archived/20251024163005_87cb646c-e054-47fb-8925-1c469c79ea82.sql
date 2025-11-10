-- Mark scavenger_hunt as disabled in the database
UPDATE public.feature_flags
SET disabled = true, is_enabled = false
WHERE flag_name = 'scavenger_hunt';

-- Ensure scavenger_hunt flag exists
INSERT INTO public.feature_flags (flag_name, is_enabled, environment, description, disabled)
SELECT 'scavenger_hunt', false, 'all', 'Controls the scavenger hunt feature', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_flags WHERE flag_name = 'scavenger_hunt'
);