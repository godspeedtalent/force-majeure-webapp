-- ========================================
-- FIX: Environments Table RLS for Anonymous Access
-- ========================================
-- This fixes the 401 Unauthorized errors preventing the app from loading

-- 1. Drop all existing policies on environments table
DROP POLICY IF EXISTS "Anyone can view environments" ON public.environments;
DROP POLICY IF EXISTS "Environments are publicly viewable" ON public.environments;
DROP POLICY IF EXISTS "Admins can manage environments" ON public.environments;
DROP POLICY IF EXISTS "public_read_environments" ON public.environments;
DROP POLICY IF EXISTS "admin_manage_environments" ON public.environments;

-- 2. Ensure RLS is enabled
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;

-- 3. Create explicit SELECT policy for anonymous and authenticated users
CREATE POLICY "public_read_environments"
ON public.environments
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (true);

-- 4. Create policy for admins to manage environments
CREATE POLICY "admin_manage_environments"
ON public.environments
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('admin', 'developer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('admin', 'developer')
  )
);

-- 5. Grant explicit table permissions to anon role
GRANT SELECT ON public.environments TO anon;
GRANT SELECT ON public.environments TO authenticated;
GRANT ALL ON public.environments TO service_role;

-- 6. Verify the policies were created
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