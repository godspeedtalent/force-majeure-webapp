-- Add status column to events table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE events
    ADD COLUMN status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'invisible'));
  END IF;
END $$;

-- Create index for status filtering (idempotent)
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Create helper function to count orders for an event
CREATE OR REPLACE FUNCTION get_event_order_count(event_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM orders
  WHERE event_id = event_id_param;
$$;

-- Update RLS policies for events table (idempotent)
-- Drop existing policies
DROP POLICY IF EXISTS "Events are publicly viewable" ON events;
DROP POLICY IF EXISTS "Published events are publicly viewable" ON events;
DROP POLICY IF EXISTS "Privileged users can view all events" ON events;

-- Create new policy for public (only published events)
CREATE POLICY "Published events are publicly viewable"
ON events
FOR SELECT
USING (status = 'published');

-- Create policy for privileged users (admins, developers, org members can see all)
CREATE POLICY "Privileged users can view all events"
ON events
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid()) OR
    (
      has_permission(auth.uid(), 'manage_events') AND
      EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = auth.uid()
        AND organization_id = events.organization_id
      )
    )
  )
);