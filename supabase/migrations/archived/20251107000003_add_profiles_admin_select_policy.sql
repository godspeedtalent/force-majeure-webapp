-- Add admin SELECT policy for profiles table
-- This allows admins to view all user profiles in the admin panel

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- Add admin UPDATE policy for profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can update profiles'
  ) THEN
    CREATE POLICY "Admins can update profiles"
    ON public.profiles
    FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());
  END IF;
END $$;

COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS 
  'Allows admins and developers to view all user profiles for management purposes';

COMMENT ON POLICY "Admins can update profiles" ON public.profiles IS 
  'Allows admins and developers to update user profiles for management purposes';
