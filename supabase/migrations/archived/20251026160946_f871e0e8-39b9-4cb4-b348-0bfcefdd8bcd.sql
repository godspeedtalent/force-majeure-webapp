-- Add RLS policies for admins to manage venues

-- Allow admins to update venues
CREATE POLICY "Admins can update venues"
ON public.venues
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to insert venues
CREATE POLICY "Admins can insert venues"
ON public.venues
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete venues
CREATE POLICY "Admins can delete venues"
ON public.venues
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));