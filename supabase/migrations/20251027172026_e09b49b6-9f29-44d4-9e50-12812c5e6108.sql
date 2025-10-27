-- Add dev mode admin access feature flag (check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.feature_flags 
    WHERE flag_name = 'dev_admin_access' 
    AND environment = 'dev'
  ) THEN
    INSERT INTO public.feature_flags (flag_name, is_enabled, description, environment, disabled)
    VALUES ('dev_admin_access', true, 'Allow authenticated users to perform admin actions in dev mode without database role', 'dev', false);
  END IF;
END $$;

-- Create function to check dev admin access
CREATE OR REPLACE FUNCTION public.is_dev_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_enabled 
     FROM public.feature_flags 
     WHERE flag_name = 'dev_admin_access' 
       AND (environment = 'dev' OR environment = 'all')
     LIMIT 1),
    false
  )
$$;

-- Add dev-mode policies for venues
DROP POLICY IF EXISTS "Admins can insert venues" ON public.venues;
CREATE POLICY "Admins can insert venues"
ON public.venues
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin()
);

DROP POLICY IF EXISTS "Admins can update venues" ON public.venues;
CREATE POLICY "Admins can update venues"
ON public.venues
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin()
);

DROP POLICY IF EXISTS "Admins can delete venues" ON public.venues;
CREATE POLICY "Admins can delete venues"
ON public.venues
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin()
);

-- Add dev-mode policies for cities
DROP POLICY IF EXISTS "Admins can insert cities" ON public.cities;
CREATE POLICY "Admins can insert cities"
ON public.cities
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin()
);

DROP POLICY IF EXISTS "Admins can update cities" ON public.cities;
CREATE POLICY "Admins can update cities"
ON public.cities
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin()
);

DROP POLICY IF EXISTS "Admins can delete cities" ON public.cities;
CREATE POLICY "Admins can delete cities"
ON public.cities
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin()
);