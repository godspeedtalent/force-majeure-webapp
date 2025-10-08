-- Add 'fan' role to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'fan';

-- Update handle_new_user function to assign fan role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');

  -- Assign 'fan' role to new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'fan');

  RETURN NEW;
END;
$$;
