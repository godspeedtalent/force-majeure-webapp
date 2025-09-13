-- Fix security warnings by setting proper search_path for functions

-- Fix the encrypt_token function
CREATE OR REPLACE FUNCTION public.encrypt_token(token_value text, user_salt text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simple encryption using built-in pgcrypto functions
  -- In production, this should use a more robust encryption method
  RETURN encode(encrypt(token_value::bytea, user_salt::bytea, 'aes'), 'base64');
END;
$$;

-- Fix the decrypt_token function
CREATE OR REPLACE FUNCTION public.decrypt_token(encrypted_token text, user_salt text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrypt the token
  RETURN convert_from(decrypt(decode(encrypted_token, 'base64'), user_salt::bytea, 'aes'), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;