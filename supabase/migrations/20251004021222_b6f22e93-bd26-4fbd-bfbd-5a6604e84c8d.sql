-- Insert 5 scavenger hunt locations
INSERT INTO public.scavenger_locations (location_name, reward_type, total_tokens, tokens_remaining, is_active)
VALUES 
  ('BOOGIE', 'free_ticket', 3, 3, true),
  ('MIRRORBALL', 'promo_code_20', 3, 3, true),
  ('DISCO', 'free_ticket', 3, 3, true),
  ('LADYBIRD', 'promo_code_20', 3, 3, true),
  ('KEEPITWEIRD', 'free_ticket', 3, 3, true);

-- For each location, create test tokens
-- Using simple hashing with pgcrypto (SHA256)
-- Token format: LOCATION_TOKEN_NUMBER (e.g., BOOGIE_TOKEN_1, BOOGIE_TOKEN_2, etc.)

DO $$
DECLARE
  loc_record RECORD;
  token_num INTEGER;
  plain_token TEXT;
  token_hash TEXT;
  salt TEXT;
BEGIN
  FOR loc_record IN 
    SELECT id, location_name, reward_type 
    FROM public.scavenger_locations 
    WHERE location_name IN ('BOOGIE', 'MIRRORBALL', 'DISCO', 'LADYBIRD', 'KEEPITWEIRD')
  LOOP
    FOR token_num IN 1..3 LOOP
      -- Create plaintext token: LOCATIONNAME_TOKEN_TOKENNUMBER
      plain_token := loc_record.location_name || '_TOKEN_' || token_num;
      
      -- Generate a salt (using current timestamp + location)
      salt := encode(digest(loc_record.location_name || token_num::text || now()::text, 'sha256'), 'hex');
      
      -- Hash the token with the salt
      token_hash := encode(digest(plain_token || salt, 'sha256'), 'hex');
      
      -- Insert the token (all unclaimed for now)
      INSERT INTO public.scavenger_tokens (
        location_id,
        token_hash,
        token_salt,
        reward_type,
        promo_code,
        is_claimed
      ) VALUES (
        loc_record.id,
        token_hash,
        salt,
        loc_record.reward_type,
        CASE 
          WHEN loc_record.reward_type = 'promo_code_20' THEN 'PROMO20'
          ELSE NULL
        END,
        false
      );
    END LOOP;
  END LOOP;
END $$;