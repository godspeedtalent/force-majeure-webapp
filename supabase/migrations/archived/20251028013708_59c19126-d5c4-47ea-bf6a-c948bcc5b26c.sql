-- Test the RLS expression directly
-- Drop and recreate the policy with better structure

DROP POLICY IF EXISTS "Admins can insert ticket tiers" ON public.ticket_tiers;

CREATE POLICY "Admins can insert ticket tiers"
ON public.ticket_tiers
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_dev_admin() OR 
  (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role))
);