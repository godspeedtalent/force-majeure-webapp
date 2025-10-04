-- Drop the existing public SELECT policy that exposes promo codes
DROP POLICY IF EXISTS "Locations are publicly viewable" ON public.scavenger_locations;

-- Create a security definer function to get location preview (without promo code)
-- This is used during token validation
CREATE OR REPLACE FUNCTION public.get_location_preview(p_location_id uuid)
RETURNS TABLE (
  id uuid,
  location_name text,
  location_description text,
  reward_type text,
  tokens_remaining integer,
  total_tokens integer,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
  WHERE id = p_location_id AND is_active = true;
$$;

-- Create a security definer function to get full location data including promo code
-- This is used only during the claim process
CREATE OR REPLACE FUNCTION public.get_location_with_promo(p_location_id uuid)
RETURNS TABLE (
  id uuid,
  location_name text,
  location_description text,
  reward_type text,
  promo_code text,
  tokens_remaining integer,
  total_tokens integer,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
  WHERE id = p_location_id AND is_active = true;
$$;