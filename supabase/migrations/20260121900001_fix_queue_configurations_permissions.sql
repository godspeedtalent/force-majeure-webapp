-- ============================================
-- Fix queue_configurations permissions
-- ============================================
-- The table only had SELECT granted, missing INSERT/UPDATE/DELETE
-- for authenticated users to manage queue settings.

-- Grant full CRUD permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.queue_configurations TO authenticated;

-- RLS Policies for queue_configurations
-- Allow anyone to view queue configurations (for checkout flow)
DROP POLICY IF EXISTS "Anyone can view queue configurations" ON queue_configurations;
CREATE POLICY "Anyone can view queue configurations" ON queue_configurations
  FOR SELECT USING (true);

-- Allow admins/developers to manage queue configurations
-- Using separate policies for different operations to handle INSERT properly
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

-- Allow event managers to manage their event's queue configuration
-- Check via organization ownership or event_staff role
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
        -- User is event staff with manager/admin role
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
        -- User owns the organization that owns this event
        EXISTS (
          SELECT 1 FROM organizations o
          WHERE o.id = e.organization_id
          AND o.owner_id = auth.uid()
        )
        OR
        -- User is event staff with manager/admin role
        EXISTS (
          SELECT 1 FROM event_staff es
          WHERE es.event_id = e.id
          AND es.user_id = auth.uid()
          AND es.role IN ('manager', 'admin')
        )
      )
    )
  );
