-- Add DELETE RLS policy for artist_registrations
-- Allows admin, developer, and org_admin roles to delete registrations
-- This is useful for removing spam, duplicates, or test data

CREATE POLICY "Admins and developers can delete artist registrations"
  ON artist_registrations FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    has_role(auth.uid(), 'org_admin')
  );

-- Also ensure authenticated users have DELETE grant on the table
GRANT DELETE ON TABLE public.artist_registrations TO authenticated;

COMMENT ON POLICY "Admins and developers can delete artist registrations" ON artist_registrations IS
  'Allows admin, developer, and org_admin roles to permanently delete artist registration requests. Use for spam, duplicates, or test data cleanup.';
