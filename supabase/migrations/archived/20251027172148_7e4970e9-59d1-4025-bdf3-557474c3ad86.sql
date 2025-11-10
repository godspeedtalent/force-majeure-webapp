-- Update policies to allow unauthenticated users when dev_admin_access is enabled

-- Update venues policies
DROP POLICY IF EXISTS "Admins can insert venues" ON public.venues;
CREATE POLICY "Admins can insert venues"
ON public.venues
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
);

DROP POLICY IF EXISTS "Admins can update venues" ON public.venues;
CREATE POLICY "Admins can update venues"
ON public.venues
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
)
WITH CHECK (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
);

DROP POLICY IF EXISTS "Admins can delete venues" ON public.venues;
CREATE POLICY "Admins can delete venues"
ON public.venues
FOR DELETE
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
);

-- Update cities policies
DROP POLICY IF EXISTS "Admins can insert cities" ON public.cities;
CREATE POLICY "Admins can insert cities"
ON public.cities
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
);

DROP POLICY IF EXISTS "Admins can update cities" ON public.cities;
CREATE POLICY "Admins can update cities"
ON public.cities
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
)
WITH CHECK (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
);

DROP POLICY IF EXISTS "Admins can delete cities" ON public.cities;
CREATE POLICY "Admins can delete cities"
ON public.cities
FOR DELETE
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
);