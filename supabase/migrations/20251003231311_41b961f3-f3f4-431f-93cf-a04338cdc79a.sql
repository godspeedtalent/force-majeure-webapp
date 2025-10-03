-- Drop the authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can update feature flags" ON public.feature_flags;

-- Allow anyone to update feature flags (dev toggle - remove in production)
CREATE POLICY "Public can update feature flags (dev only)"
ON public.feature_flags
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
