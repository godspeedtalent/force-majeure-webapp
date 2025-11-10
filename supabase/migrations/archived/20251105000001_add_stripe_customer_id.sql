-- Add Stripe customer ID field to profiles table for payment integration
-- This migration is idempotent and safe to run multiple times

DO $$ 
BEGIN
  -- Add stripe_customer_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema='public' 
                 AND table_name='profiles' AND column_name='stripe_customer_id') THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;
END $$;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON public.profiles(stripe_customer_id);

-- Add comment
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for payment processing';
