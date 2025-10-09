-- This migration applies only the critical changes needed to fix email confirmations
-- Run this directly in Supabase SQL Editor if automated migration push continues to fail

-- 1. Create profiles table if it doesn't exist (from 20250823163027)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  spotify_access_token TEXT,
  spotify_refresh_token TEXT,
  spotify_token_expires_at TIMESTAMP WITH TIME ZONE,
  spotify_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Add trigger for timestamps
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add full_name column (from 20251009023629)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name text;

-- 3. Add is_public column (from 20251009083638)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- 4. Create or replace the handle_new_user function with all required fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, full_name, is_public)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE((NEW.raw_user_meta_data ->> 'is_public')::boolean, false)
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    full_name = EXCLUDED.full_name,
    is_public = EXCLUDED.is_public;

  RETURN NEW;
END;
$$;

-- 5. Create trigger for new user signup (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Done! The email confirmation system should now work properly.
