-- Drop existing admin update policy that might be too restrictive
DROP POLICY IF EXISTS "Admins can update venues" ON public.venues;

-- Create new admin update policy with explicit columns
CREATE POLICY "Admins can update venues"
ON public.venues
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure the update trigger exists for venues
CREATE OR REPLACE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();