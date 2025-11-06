-- ========================================
-- FIX: Add SELECT policies to user_roles table
-- ========================================
-- Run this directly in the Supabase SQL Editor
-- This fixes the 406 error when querying user_roles

-- Drop existing SELECT policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to view all roles (includes service role key access)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR is_dev_admin()
  OR auth.jwt() ->> 'role' = 'service_role'
);

-- Add INSERT policy for admins if it doesn't exist
DROP POLICY IF EXISTS "Admins can insert user_roles" ON public.user_roles;
CREATE POLICY "Admins can insert user_roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;
