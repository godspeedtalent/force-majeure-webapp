-- ==========================================
-- FIX ENVIRONMENTS TABLE FOR ANONYMOUS ACCESS
-- This script fixes the RLS policies to allow unauthenticated
-- users to read from the environments table
-- ==========================================

-- Step 1: Drop ALL existing policies on environments table
DROP POLICY IF EXISTS "Anyone can view environments" ON public.environments;
DROP POLICY IF EXISTS "Environments are viewable by everyone" ON public.environments;
DROP POLICY IF EXISTS "Admins can manage environments" ON public.environments;

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
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Step 4: Ensure RLS is enabled
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'environments'
ORDER BY policyname;
