-- ========================================
-- Ensure All Users Have Default User Role
-- ========================================
-- This script:
-- 1. Assigns the 'user' role to all existing users who don't have it
-- 2. Creates a trigger to automatically assign 'user' role on new user creation

-- Step 1: Assign 'user' role to all existing users who don't have it
-- ========================================

DO $$
DECLARE
  user_role_id UUID;
  user_record RECORD;
  assigned_count INTEGER := 0;
BEGIN
  -- Get the 'user' role ID
  SELECT id INTO user_role_id
  FROM public.roles
  WHERE name = 'user'
  LIMIT 1;

  IF user_role_id IS NULL THEN
    RAISE EXCEPTION 'User role not found in roles table. Please ensure the roles table is properly initialized.';
  END IF;

  -- Find all users in auth.users who don't have the 'user' role
  FOR user_record IN
    SELECT u.id
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = u.id
      AND ur.role_id = user_role_id
    )
  LOOP
    -- Insert the user role
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (user_record.id, user_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;

    assigned_count := assigned_count + 1;
  END LOOP;

  RAISE NOTICE 'Assigned user role to % existing users', assigned_count;
END $$;

-- Step 2: Create function to auto-assign user role on profile creation
-- ========================================

CREATE OR REPLACE FUNCTION public.assign_default_user_role()
RETURNS TRIGGER AS $$
DECLARE
  user_role_id UUID;
BEGIN
  -- Get the 'user' role ID
  SELECT id INTO user_role_id
  FROM public.roles
  WHERE name = 'user'
  LIMIT 1;

  -- Only proceed if we found the user role
  IF user_role_id IS NOT NULL THEN
    -- Insert the default user role for the new user
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.user_id, user_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS assign_default_user_role_trigger ON public.profiles;

-- Create trigger on profiles table (fires after profile creation)
CREATE TRIGGER assign_default_user_role_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_default_user_role();

-- ========================================
-- Verification
-- ========================================

-- Show users without any roles (should be empty after running this script)
SELECT 'Users without any roles:' as info;
SELECT u.id, u.email, u.created_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
)
LIMIT 10;

-- Show count of users with the 'user' role
SELECT 'Total users with user role:' as info;
SELECT COUNT(*) as user_count
FROM public.user_roles ur
JOIN public.roles r ON r.id = ur.role_id
WHERE r.name = 'user';

-- Show all users and their roles
SELECT 'Sample of users and their roles:' as info;
SELECT
  u.email,
  array_agg(r.name) as roles
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.roles r ON r.id = ur.role_id
GROUP BY u.id, u.email
ORDER BY u.created_at DESC
LIMIT 10;
