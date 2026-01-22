-- Fix ticketing_fees RLS to allow admins to see all fees (including inactive)
-- Previously, the SELECT policy only allowed viewing active fees, which broke
-- the admin UI when trying to manage disabled fees.

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Ticketing fees are publicly viewable" ON ticketing_fees;

-- Create two policies: one for public (active only) and one for admins (all fees)
CREATE POLICY "Public can view active ticketing fees"
  ON ticketing_fees FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    OR (
      auth.uid() IS NOT NULL AND
      (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
    )
  );

COMMENT ON POLICY "Public can view active ticketing fees" ON ticketing_fees IS
  'Public users see only active fees. Admins see all fees for management purposes.';
