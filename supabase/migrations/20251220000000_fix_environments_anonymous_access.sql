-- ==========================================
-- FIX ENVIRONMENTS TABLE FOR ANONYMOUS ACCESS
-- This migration fixes the RLS policies to allow unauthenticated
-- users to read from the environments table
-- ==========================================

-- Step 1: Drop ALL existing policies on environments table
DROP POLICY IF EXISTS "Anyone can view environments" ON public.environments;
DROP POLICY IF EXISTS "Environments are viewable by everyone" ON public.environments;
DROP POLICY IF EXISTS "Admins can manage environments" ON public.environments;
DROP POLICY IF EXISTS "environments_select_policy" ON public.environments;
DROP POLICY IF EXISTS "environments_admin_policy" ON public.environments;

-- Step 2: Create a new PERMISSIVE policy for SELECT
-- This explicitly grants access to BOTH anon (unauthenticated) and authenticated users
CREATE POLICY "environments_select_policy"
ON public.environments
FOR SELECT
TO anon, authenticated
USING (true);

-- Step 3: Create admin policy for managing environments
CREATE POLICY "environments_admin_policy"
ON public.environments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'admin'
  )
);

-- Step 4: Ensure RLS is enabled
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;
