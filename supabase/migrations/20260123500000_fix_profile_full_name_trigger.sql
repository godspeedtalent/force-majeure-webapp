-- Migration: Fix profile full_name trigger to properly combine first_name + last_name
--
-- Problem: The handle_new_user trigger looks for 'full_name' or 'name' in raw_user_meta_data,
-- but the signup form sends 'first_name' and 'last_name' as separate keys.
-- This caused most users to have NULL full_name in their profiles.

-- Update the handle_new_user function to properly combine first_name + last_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    user_id,
    email,
    display_name,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    -- Fix: Combine first_name + last_name when full_name not provided
    -- Priority: full_name > first_name + last_name > name > NULL
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NULLIF(TRIM(CONCAT_WS(' ',
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
      )), ''),
      NEW.raw_user_meta_data->>'name'
    ),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Backfill existing profiles with NULL full_name
-- This updates profiles where the user has first_name/last_name in their auth metadata
UPDATE public.profiles p
SET
  full_name = NULLIF(TRIM(CONCAT_WS(' ',
    au.raw_user_meta_data->>'first_name',
    au.raw_user_meta_data->>'last_name'
  )), ''),
  updated_at = NOW()
FROM auth.users au
WHERE p.user_id = au.id
  AND p.full_name IS NULL
  AND (
    au.raw_user_meta_data->>'first_name' IS NOT NULL
    OR au.raw_user_meta_data->>'last_name' IS NOT NULL
  );

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile record when a new user signs up. Combines first_name + last_name into full_name.';
