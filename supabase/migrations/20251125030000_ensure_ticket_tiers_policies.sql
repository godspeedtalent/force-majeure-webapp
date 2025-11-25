-- Ensure ticket_tiers RLS policies exist
-- This migration ensures that ticket tier policies are properly created

-- First, drop ALL existing policies on ticket_tiers (if any)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ticket_tiers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ticket_tiers';
    END LOOP;
END $$;

-- PUBLIC READ ACCESS (everyone can view ticket tiers)
CREATE POLICY "Ticket tiers are publicly viewable"
  ON ticket_tiers FOR SELECT
  TO authenticated, anon
  USING (true);

-- INSERT ACCESS (admins and event managers)
CREATE POLICY "Admins and event managers can insert ticket tiers"
  ON ticket_tiers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      is_dev_admin(auth.uid()) OR
      has_permission(auth.uid(), 'manage_events')
    )
  );

-- UPDATE ACCESS (admins and event managers)
CREATE POLICY "Admins and event managers can update ticket tiers"
  ON ticket_tiers FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      is_dev_admin(auth.uid()) OR
      has_permission(auth.uid(), 'manage_events')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      is_dev_admin(auth.uid()) OR
      has_permission(auth.uid(), 'manage_events')
    )
  );

-- DELETE ACCESS (admins and event managers)
CREATE POLICY "Admins and event managers can delete ticket_tiers"
  ON ticket_tiers FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      is_dev_admin(auth.uid()) OR
      has_permission(auth.uid(), 'manage_events')
    )
  );
