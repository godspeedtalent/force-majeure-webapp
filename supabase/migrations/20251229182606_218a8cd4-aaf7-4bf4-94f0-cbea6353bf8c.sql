-- Fix permissions for artist_registrations table
-- Grant all necessary permissions to authenticated users

-- First, ensure the authenticated role has proper permissions
GRANT SELECT, INSERT ON TABLE public.artist_registrations TO authenticated;
GRANT SELECT, INSERT ON TABLE public.artist_registrations TO anon;

-- Also ensure service_role has full access
GRANT ALL ON TABLE public.artist_registrations TO service_role;

-- Verify RLS is enabled
ALTER TABLE public.artist_registrations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies to ensure they're correct
DROP POLICY IF EXISTS "Users can create artist registrations" ON public.artist_registrations;
DROP POLICY IF EXISTS "Users can view their own artist registrations" ON public.artist_registrations;
DROP POLICY IF EXISTS "Admins and developers can view all artist registrations" ON public.artist_registrations;
DROP POLICY IF EXISTS "Admins and developers can update artist registrations" ON public.artist_registrations;
DROP POLICY IF EXISTS "Admins and developers can delete artist registrations" ON public.artist_registrations;

-- Policy: Any authenticated user can insert their own registration
CREATE POLICY "Users can create artist registrations"
  ON public.artist_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own registrations
CREATE POLICY "Users can view their own artist registrations"
  ON public.artist_registrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins/developers can view all registrations
CREATE POLICY "Admins and developers can view all artist registrations"
  ON public.artist_registrations
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    has_role(auth.uid(), 'org_admin')
  );

-- Policy: Admins/developers can update registrations
CREATE POLICY "Admins and developers can update artist registrations"
  ON public.artist_registrations
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    has_role(auth.uid(), 'org_admin')
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    has_role(auth.uid(), 'org_admin')
  );

-- Policy: Admins/developers can delete registrations
CREATE POLICY "Admins and developers can delete artist registrations"
  ON public.artist_registrations
  FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    has_role(auth.uid(), 'org_admin')
  );