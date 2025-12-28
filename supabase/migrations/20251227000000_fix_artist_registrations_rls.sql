-- Fix artist_registrations RLS policies to allow both admin and developer roles to access
-- Previously only admin could view/update registrations

-- Drop existing admin-only policies
DROP POLICY IF EXISTS "Admins can view all artist registrations" ON artist_registrations;
DROP POLICY IF EXISTS "Admins can update artist registrations" ON artist_registrations;

-- Create new policies that allow both admin and developer roles
CREATE POLICY "Admins and developers can view all artist registrations"
  ON artist_registrations FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    has_role(auth.uid(), 'org_admin')
  );

CREATE POLICY "Admins and developers can update artist registrations"
  ON artist_registrations FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    has_role(auth.uid(), 'org_admin')
  );

-- Add comment documenting the change
COMMENT ON POLICY "Admins and developers can view all artist registrations" ON artist_registrations IS
  'Allows admin, developer, and org_admin roles to view all artist registration requests';

COMMENT ON POLICY "Admins and developers can update artist registrations" ON artist_registrations IS
  'Allows admin, developer, and org_admin roles to approve/deny artist registration requests';
