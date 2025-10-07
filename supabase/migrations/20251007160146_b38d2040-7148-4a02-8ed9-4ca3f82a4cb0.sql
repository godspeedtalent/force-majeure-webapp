-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_location_preview(uuid);
DROP FUNCTION IF EXISTS public.get_location_with_promo(uuid);

-- Drop the secret_code column from scavenger_locations
ALTER TABLE public.scavenger_locations DROP COLUMN IF EXISTS secret_code;

-- Recreate get_location_preview function with location id parameter
CREATE OR REPLACE FUNCTION public.get_location_preview(p_location_id uuid)
RETURNS TABLE(
  id uuid,
  location_name text,
  location_description text,
  reward_type text,
  tokens_remaining integer,
  total_tokens integer,
  is_active boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Recreate get_location_with_promo function with location id parameter
CREATE OR REPLACE FUNCTION public.get_location_with_promo(p_location_id uuid)
RETURNS TABLE(
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
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;