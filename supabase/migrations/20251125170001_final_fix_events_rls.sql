-- ============================================================================
-- FINAL FIX: Events RLS - Keep Consistent with ticket_tiers
-- ============================================================================

-- Drop ALL existing events INSERT policies
DROP POLICY IF EXISTS "Admins and devs can insert events" ON events;
DROP POLICY IF EXISTS "Org members with manage_events can insert events" ON events;
DROP POLICY IF EXISTS "Admins and event managers can insert events" ON events;

-- Create ONE simple INSERT policy
CREATE POLICY "Authenticated users with admin/dev role can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer')
    )
  );

COMMENT ON POLICY "Authenticated users with admin/dev role can insert events" ON events IS
  'Simple INSERT policy for events. Matches ticket_tiers policy to ensure consistency.';
