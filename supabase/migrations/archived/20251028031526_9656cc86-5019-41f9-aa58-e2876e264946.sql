-- Drop the existing INSERT policy for ticket_tiers
DROP POLICY IF EXISTS "Admins can insert ticket tiers" ON public.ticket_tiers;

-- Create new INSERT policy that allows unauthenticated access in dev mode
CREATE POLICY "Admins can insert ticket tiers"
ON public.ticket_tiers
FOR INSERT
TO public  -- Changed from 'authenticated' to 'public' to allow dev mode
WITH CHECK (
  -- Allow if dev admin flag is enabled (works for both authenticated and unauthenticated)
  EXISTS (
    SELECT 1
    FROM public.feature_flags
    WHERE flag_name = 'dev_admin_access'
      AND is_enabled = true
      AND (environment = 'dev' OR environment = 'all')
  )
  OR
  -- Require authentication and admin role in production
  (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role))
);