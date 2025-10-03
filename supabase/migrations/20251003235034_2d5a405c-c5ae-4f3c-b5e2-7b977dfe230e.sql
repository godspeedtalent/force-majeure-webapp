-- Move reward_type from locations to tokens to support mixed rewards per location

-- Add reward_type column to scavenger_tokens
ALTER TABLE public.scavenger_tokens
ADD COLUMN reward_type public.reward_type NOT NULL DEFAULT 'promo_code_20';

-- Add promo_code column to scavenger_tokens (for promo code rewards)
ALTER TABLE public.scavenger_tokens
ADD COLUMN promo_code text;

-- Make reward_type nullable on scavenger_locations (no longer primary source)
ALTER TABLE public.scavenger_locations
ALTER COLUMN reward_type DROP NOT NULL;

-- Drop the existing test data if any
DELETE FROM public.scavenger_locations WHERE location_name LIKE 'Location %';

-- Create the 5 locations (location-level reward_type is now just metadata)
INSERT INTO public.scavenger_locations (location_name, location_description, reward_type, total_tokens, tokens_remaining, is_active)
VALUES
  ('Location 1', 'Find this spot for exclusive rewards!', NULL, 5, 5, true),
  ('Location 2', 'Find this spot for exclusive rewards!', NULL, 5, 5, true),
  ('Location 3', 'Find this spot for exclusive rewards!', NULL, 5, 5, true),
  ('Location 4', 'Find this spot for exclusive rewards!', NULL, 5, 5, true),
  ('Location 5', 'Find this spot for exclusive rewards!', NULL, 5, 5, true);