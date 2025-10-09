-- Create a secure token encryption system
-- First, let's add encrypted token columns and remove plaintext ones

-- Add encrypted token columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='spotify_access_token_encrypted') THEN
    ALTER TABLE public.profiles ADD COLUMN spotify_access_token_encrypted text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='spotify_refresh_token_encrypted') THEN
    ALTER TABLE public.profiles ADD COLUMN spotify_refresh_token_encrypted text;
  END IF;
END $$;

-- We'll keep the existing columns for now during migration to avoid breaking functionality
-- The plaintext columns will be removed in a follow-up migration after code is updated

-- Create a function to handle token encryption/decryption
-- This will be used by edge functions to securely handle tokens
CREATE OR REPLACE FUNCTION public.encrypt_token(token_value text, user_salt text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple encryption using built-in pgcrypto functions
  -- In production, this should use a more robust encryption method
  RETURN encode(encrypt(token_value::bytea, user_salt::bytea, 'aes'), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_token(encrypted_token text, user_salt text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Decrypt the token
  RETURN convert_from(decrypt(decode(encrypted_token, 'base64'), user_salt::bytea, 'aes'), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;
