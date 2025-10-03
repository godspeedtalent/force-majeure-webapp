-- Allow authenticated users to update feature flags (for dev toggle)
CREATE POLICY "Authenticated users can update feature flags"
ON public.feature_flags
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
