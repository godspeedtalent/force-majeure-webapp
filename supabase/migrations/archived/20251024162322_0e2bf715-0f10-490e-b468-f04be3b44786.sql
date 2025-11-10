-- Add disabled column to feature_flags table
ALTER TABLE public.feature_flags 
ADD COLUMN IF NOT EXISTS disabled boolean NOT NULL DEFAULT false;

-- Delete the specified feature flags
DELETE FROM public.feature_flags 
WHERE flag_name IN (
  'scavenger_hunt_active',
  'show_leaderboard',
  'demo_pages',
  'event_checkout_timer'
);

-- Update descriptions for remaining flags
UPDATE public.feature_flags
SET description = 'Controls whether the ticketing/checkout feature is available for events'
WHERE flag_name = 'ticketing';

-- Ensure ticketing flag exists
INSERT INTO public.feature_flags (flag_name, is_enabled, environment, description)
SELECT 'ticketing', true, 'all', 'Controls whether the ticketing/checkout feature is available for events'
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_flags WHERE flag_name = 'ticketing' AND environment = 'all'
);