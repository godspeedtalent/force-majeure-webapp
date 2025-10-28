-- Drop and recreate the INSERT policy with a simpler, more explicit check
DROP POLICY IF EXISTS "Admins can insert ticket tiers" ON public.ticket_tiers;

-- Create a new policy that explicitly allows inserts when dev_admin is enabled
-- or when user has admin role
CREATE POLICY "Admins can insert ticket tiers"
ON public.ticket_tiers
FOR INSERT
TO authenticated
WITH CHECK (
  -- First check if dev admin access is enabled (bypass all checks)
  EXISTS (
    SELECT 1 FROM public.feature_flags 
    WHERE flag_name = 'dev_admin_access' 
      AND is_enabled = true 
      AND (environment = 'dev' OR environment = 'all')
  )
  OR
  -- Otherwise check if user has admin role
  public.has_role(auth.uid(), 'admin'::app_role)
);