-- Fix user_roles RLS policies to allow SELECT
-- This allows users to check their own roles and admins to check any roles

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can view all roles" ON public.user_roles;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Allow admins to view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- Add INSERT policy for admins if it doesn't exist
DROP POLICY IF EXISTS "Admins can insert user_roles" ON public.user_roles;
CREATE POLICY "Admins can insert user_roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());
