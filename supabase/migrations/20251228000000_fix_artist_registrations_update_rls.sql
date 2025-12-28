-- Fix artist_registrations UPDATE RLS policy
-- The UPDATE policy needs both USING and WITH CHECK clauses
-- USING: controls which rows the user can see/update
-- WITH CHECK: controls the validation of the new row values after update

-- Drop and recreate the UPDATE policy with proper WITH CHECK clause
DROP POLICY IF EXISTS "Admins and developers can update artist registrations" ON artist_registrations;

CREATE POLICY "Admins and developers can update artist registrations"
  ON artist_registrations FOR UPDATE
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

-- Also ensure authenticated users have UPDATE grant on the table
GRANT UPDATE ON TABLE public.artist_registrations TO authenticated;

COMMENT ON POLICY "Admins and developers can update artist registrations" ON artist_registrations IS
  'Allows admin, developer, and org_admin roles to approve/deny artist registration requests. Includes WITH CHECK for proper RLS enforcement.';
