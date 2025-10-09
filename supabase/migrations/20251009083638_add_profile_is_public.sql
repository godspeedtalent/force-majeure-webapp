-- Add is_public column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Update the handle_new_user function to save is_public
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
  );
  RETURN NEW;
END;
$$;
