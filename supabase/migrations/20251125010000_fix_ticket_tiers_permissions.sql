-- Fix ticket_tiers RLS policies to allow users with MANAGE_EVENTS permission
-- This allows users who can manage events to also create/update/delete ticket tiers

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert ticket tiers" ON ticket_tiers;
DROP POLICY IF EXISTS "Admins can update ticket tiers" ON ticket_tiers;
DROP POLICY IF EXISTS "Admins can delete ticket tiers" ON ticket_tiers;

-- Recreate policies with MANAGE_EVENTS permission check
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
