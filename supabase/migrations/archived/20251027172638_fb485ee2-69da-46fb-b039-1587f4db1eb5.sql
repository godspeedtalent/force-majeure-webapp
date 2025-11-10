-- Add dev-mode policies for events table to allow creation
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
CREATE POLICY "Admins can insert events"
ON public.events
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
);

DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events"
ON public.events
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
)
WITH CHECK (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
);

DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events"
ON public.events
FOR DELETE
USING (
  (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)) 
  OR is_dev_admin()
);