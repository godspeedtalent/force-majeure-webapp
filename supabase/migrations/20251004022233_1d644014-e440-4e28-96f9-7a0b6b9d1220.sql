-- First, update all locations to have 5 total tokens and reset remaining count
UPDATE public.scavenger_locations
SET total_tokens = 5, tokens_remaining = 5
WHERE location_name IN ('BOOGIE', 'MIRRORBALL', 'DISCO', 'LADYBIRD', 'KEEPITWEIRD');

-- Add promo_code column to scavenger_locations
ALTER TABLE public.scavenger_locations
ADD COLUMN IF NOT EXISTS promo_code TEXT;

-- Set promo codes for all locations (they'll all use the same 20% off code)
UPDATE public.scavenger_locations
SET promo_code = 'FM20OFF'
WHERE location_name IN ('BOOGIE', 'MIRRORBALL', 'DISCO', 'LADYBIRD', 'KEEPITWEIRD');

-- Add device_fingerprint column to scavenger_claims
ALTER TABLE public.scavenger_claims
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- Delete all existing tokens
DELETE FROM public.scavenger_tokens;

-- Remove reward_type and promo_code from scavenger_tokens as they're determined at claim time
ALTER TABLE public.scavenger_tokens
DROP COLUMN IF EXISTS reward_type,
DROP COLUMN IF EXISTS promo_code;

-- Insert exactly 1 token per location (5 total)
-- Each token is just the location name itself for simplicity
DO $$
DECLARE
  loc_record RECORD;
  plain_token TEXT;
  token_hash TEXT;
  salt TEXT;
BEGIN
  FOR loc_record IN 
    SELECT id, location_name
    FROM public.scavenger_locations 
    WHERE location_name IN ('BOOGIE', 'MIRRORBALL', 'DISCO', 'LADYBIRD', 'KEEPITWEIRD')
  LOOP
    -- Use the location name as the plaintext token
    plain_token := loc_record.location_name;
    
    -- Generate a unique salt for this token
    salt := encode(digest(loc_record.location_name || now()::text, 'sha256'), 'hex');
    
    -- Hash the token with the salt using bcrypt-compatible method
    -- Note: We'll use SHA256 for now since bcrypt isn't available in migrations
    token_hash := encode(digest(plain_token || salt, 'sha256'), 'hex');
    
    -- Insert exactly ONE token per location
    INSERT INTO public.scavenger_tokens (
      location_id,
      token_hash,
      token_salt,
      is_claimed
    ) VALUES (
      loc_record.id,
      token_hash,
      salt,
      false
    );
  END LOOP;
END $$;