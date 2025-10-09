-- Move reward_type from locations to tokens to support mixed rewards per location

-- Add reward_type column to scavenger_tokens if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='scavenger_tokens' AND column_name='reward_type') THEN
    ALTER TABLE public.scavenger_tokens ADD COLUMN reward_type public.reward_type NOT NULL DEFAULT 'promo_code_20';
  END IF;
END $$;

-- Add promo_code column to scavenger_tokens if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='scavenger_tokens' AND column_name='promo_code') THEN
    ALTER TABLE public.scavenger_tokens ADD COLUMN promo_code text;
  END IF;
END $$;

-- Make reward_type nullable on scavenger_locations (no longer primary source)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public'
    AND table_name='scavenger_locations'
    AND column_name='reward_type'
    AND is_nullable='NO'
  ) THEN
    ALTER TABLE public.scavenger_locations ALTER COLUMN reward_type DROP NOT NULL;
  END IF;
END $$;

-- Drop the existing test data if any
DELETE FROM public.scavenger_locations WHERE location_name LIKE 'Location %';

-- Create the 5 locations (location-level reward_type is now just metadata)
-- Skip reward_type if column doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='scavenger_locations' AND column_name='reward_type') THEN
    -- Insert with reward_type column
    INSERT INTO public.scavenger_locations (location_name, location_description, reward_type, total_tokens, tokens_remaining, is_active)
    SELECT * FROM (VALUES
      ('Location 1', 'Find this spot for exclusive rewards!', NULL::public.reward_type, 5, 5, true),
      ('Location 2', 'Find this spot for exclusive rewards!', NULL::public.reward_type, 5, 5, true),
      ('Location 3', 'Find this spot for exclusive rewards!', NULL::public.reward_type, 5, 5, true),
      ('Location 4', 'Find this spot for exclusive rewards!', NULL::public.reward_type, 5, 5, true),
      ('Location 5', 'Find this spot for exclusive rewards!', NULL::public.reward_type, 5, 5, true)
    ) AS v(location_name, location_description, reward_type, total_tokens, tokens_remaining, is_active)
    WHERE NOT EXISTS (SELECT 1 FROM public.scavenger_locations WHERE scavenger_locations.location_name = v.location_name);
  ELSE
    -- Insert without reward_type column
    INSERT INTO public.scavenger_locations (location_name, location_description, total_tokens, tokens_remaining, is_active)
    SELECT * FROM (VALUES
      ('Location 1', 'Find this spot for exclusive rewards!', 5, 5, true),
      ('Location 2', 'Find this spot for exclusive rewards!', 5, 5, true),
      ('Location 3', 'Find this spot for exclusive rewards!', 5, 5, true),
      ('Location 4', 'Find this spot for exclusive rewards!', 5, 5, true),
      ('Location 5', 'Find this spot for exclusive rewards!', 5, 5, true)
    ) AS v(location_name, location_description, total_tokens, tokens_remaining, is_active)
    WHERE NOT EXISTS (SELECT 1 FROM public.scavenger_locations WHERE scavenger_locations.location_name = v.location_name);
  END IF;
END $$;
