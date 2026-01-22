-- ============================================
-- Fix event_staff RLS infinite recursion
-- ============================================
-- The "Event managers can manage their event staff" policy
-- queries event_staff from within event_staff's RLS policy,
-- causing infinite recursion when accessing queue_configurations
-- (which also checks event_staff).
--
-- Solution: Use the existing SECURITY DEFINER function is_event_manager()
-- which bypasses RLS when checking.

-- Drop the problematic policy
DROP POLICY IF EXISTS "Event managers can manage their event staff" ON event_staff;

-- Recreate using the SECURITY DEFINER function to avoid recursion
CREATE POLICY "Event managers can manage their event staff"
  ON event_staff FOR ALL
  TO authenticated
  USING (
    is_event_manager(auth.uid(), event_staff.event_id)
  )
  WITH CHECK (
    is_event_manager(auth.uid(), event_staff.event_id)
  );

-- Also update the queue_configurations policies to use the helper function
-- for consistency and to avoid potential future recursion issues

DROP POLICY IF EXISTS "Event managers can manage queue configurations" ON queue_configurations;
CREATE POLICY "Event managers can manage queue configurations" ON queue_configurations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = queue_configurations.event_id
      AND (
        -- User owns the organization that owns this event
        EXISTS (
          SELECT 1 FROM organizations o
          WHERE o.id = e.organization_id
          AND o.owner_id = auth.uid()
        )
        OR
        -- User is event manager (using SECURITY DEFINER function)
        is_event_manager(auth.uid(), e.id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND (
        -- User owns the organization that owns this event
        EXISTS (
          SELECT 1 FROM organizations o
          WHERE o.id = e.organization_id
          AND o.owner_id = auth.uid()
        )
        OR
        -- User is event manager (using SECURITY DEFINER function)
        is_event_manager(auth.uid(), e.id)
      )
    )
  );
