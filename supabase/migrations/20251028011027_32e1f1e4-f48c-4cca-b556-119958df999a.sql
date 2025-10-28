-- Update ticket_tiers RLS policies to include dev admin access

-- Drop existing admin insert policy
DROP POLICY IF EXISTS "Admins can insert ticket tiers" ON public.ticket_tiers;

-- Recreate with dev admin access check
CREATE POLICY "Admins can insert ticket tiers"
ON public.ticket_tiers
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
);

-- Update the other admin policies as well for consistency
DROP POLICY IF EXISTS "Admins can update ticket tiers" ON public.ticket_tiers;
DROP POLICY IF EXISTS "Admins can delete ticket tiers" ON public.ticket_tiers;

CREATE POLICY "Admins can update ticket tiers"
ON public.ticket_tiers
FOR UPDATE
TO authenticated
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
)
WITH CHECK (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
);

CREATE POLICY "Admins can delete ticket tiers"
ON public.ticket_tiers
FOR DELETE
TO authenticated
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
);