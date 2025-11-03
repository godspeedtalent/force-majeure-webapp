-- Add billing address fields to profiles table
-- These fields allow users to save their billing information for faster checkout

DO $$
BEGIN
  -- Add billing_address column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='profiles' AND column_name='billing_address') THEN
    ALTER TABLE public.profiles ADD COLUMN billing_address TEXT;
  END IF;

  -- Add billing_city column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='profiles' AND column_name='billing_city') THEN
    ALTER TABLE public.profiles ADD COLUMN billing_city TEXT;
  END IF;

  -- Add billing_state column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='profiles' AND column_name='billing_state') THEN
    ALTER TABLE public.profiles ADD COLUMN billing_state TEXT;
  END IF;

  -- Add billing_zip column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='profiles' AND column_name='billing_zip') THEN
    ALTER TABLE public.profiles ADD COLUMN billing_zip TEXT;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.billing_address IS 'User''s billing street address';
COMMENT ON COLUMN public.profiles.billing_city IS 'User''s billing city';
COMMENT ON COLUMN public.profiles.billing_state IS 'User''s billing state/province';
COMMENT ON COLUMN public.profiles.billing_zip IS 'User''s billing ZIP/postal code';
