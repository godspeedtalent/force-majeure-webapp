-- ============================================
-- Fix queue_configurations RLS WITH CHECK clauses
-- ============================================
-- The previous migration didn't include WITH CHECK clauses
-- which are needed for INSERT/UPDATE operations.

-- Recreate admin policy with WITH CHECK
DROP POLICY IF EXISTS "Admins can manage queue configurations" ON queue_configurations;
CREATE POLICY "Admins can manage queue configurations" ON queue_configurations
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Recreate event managers policy with WITH CHECK
DROP POLICY IF EXISTS "Event managers can manage queue configurations" ON queue_configurations;
CREATE POLICY "Event managers can manage queue configurations" ON queue_configurations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = queue_configurations.event_id
      AND (
        EXISTS (
          SELECT 1 FROM organizations o
          WHERE o.id = e.organization_id
          AND o.owner_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM event_staff es
          WHERE es.event_id = e.id
          AND es.user_id = auth.uid()
          AND es.role IN ('manager', 'admin')
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_id
      AND (
        EXISTS (
          SELECT 1 FROM organizations o
          WHERE o.id = e.organization_id
          AND o.owner_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM event_staff es
          WHERE es.event_id = e.id
          AND es.user_id = auth.uid()
          AND es.role IN ('manager', 'admin')
        )
      )
    )
  );
