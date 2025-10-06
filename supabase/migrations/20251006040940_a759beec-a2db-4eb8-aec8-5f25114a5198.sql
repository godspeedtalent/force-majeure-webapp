-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_location_preview(uuid);
DROP FUNCTION IF EXISTS public.get_location_with_promo(uuid);

-- Add secret code and label to scavenger_locations
ALTER TABLE public.scavenger_locations
ADD COLUMN secret_code UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN label TEXT;

-- Create unique index on secret_code for fast lookups
CREATE UNIQUE INDEX idx_scavenger_locations_secret_code ON public.scavenger_locations(secret_code);

-- Remove token_id from scavenger_claims
ALTER TABLE public.scavenger_claims
DROP COLUMN IF EXISTS token_id;

-- Drop the scavenger_tokens table entirely
DROP TABLE IF EXISTS public.scavenger_tokens;

-- Create new get_location_preview function with secret_code parameter
CREATE OR REPLACE FUNCTION public.get_location_preview(p_secret_code UUID)
RETURNS TABLE(
  id UUID,
  location_name TEXT,
  location_description TEXT,
  reward_type TEXT,
  tokens_remaining INTEGER,
  total_tokens INTEGER,
  is_active BOOLEAN
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    id,
    location_name,
    location_description,
    reward_type::text,
    tokens_remaining,
    total_tokens,
    is_active
  FROM public.scavenger_locations
  WHERE secret_code = p_secret_code AND is_active = true;
$$;

-- Create new get_location_with_promo function with secret_code parameter
CREATE OR REPLACE FUNCTION public.get_location_with_promo(p_secret_code UUID)
RETURNS TABLE(
  id UUID,
  location_name TEXT,
  location_description TEXT,
  reward_type TEXT,
  promo_code TEXT,
  tokens_remaining INTEGER,
  total_tokens INTEGER,
  is_active BOOLEAN
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    id,
    location_name,
    location_description,
    reward_type::text,
    promo_code,
    tokens_remaining,
    total_tokens,
    is_active
  FROM public.scavenger_locations
  WHERE secret_code = p_secret_code AND is_active = true;
$$;