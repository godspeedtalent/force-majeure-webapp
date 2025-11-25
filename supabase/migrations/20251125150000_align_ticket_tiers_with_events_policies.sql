-- ============================================================================
-- Align ticket_tiers RLS policies with events table policies
-- ============================================================================
--
-- Problem: ticket_tiers requires manage_events permission, but events table doesn't
-- Solution: Make both tables consistent - allow:
--   1. Admin role or dev_admin flag (global access)
--   2. Organization members with manage_events permission (org-scoped access)
--
-- This ensures users who can create events can also create ticket tiers
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Drop existing policies
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all ticket_tiers policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'ticket_tiers') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ticket_tiers';
    END LOOP;

    -- Drop all events policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'events') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON events';
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- EVENTS TABLE POLICIES
-- ----------------------------------------------------------------------------

-- Public read access
CREATE POLICY "Events are publicly viewable"
  ON events FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert: Admin/dev-admin OR org member with manage_events permission
CREATE POLICY "Admins and event managers can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      -- Global access: Admin or dev admin
      has_role(auth.uid(), 'admin') OR
      is_dev_admin(auth.uid()) OR

      -- Organization access: Has manage_events permission AND event belongs to their org
      (
        has_permission(auth.uid(), 'manage_events') AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.organization_id = events.organization_id
        )
      )
    )
  );

-- Update: Same permissions as insert
CREATE POLICY "Admins and event managers can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      is_dev_admin(auth.uid()) OR
      (
        has_permission(auth.uid(), 'manage_events') AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.organization_id = events.organization_id
        )
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      is_dev_admin(auth.uid()) OR
      (
        has_permission(auth.uid(), 'manage_events') AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.organization_id = events.organization_id
        )
      )
    )
  );

-- Delete: Same permissions as insert/update
CREATE POLICY "Admins and event managers can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      is_dev_admin(auth.uid()) OR
      (
        has_permission(auth.uid(), 'manage_events') AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.organization_id = events.organization_id
        )
      )
    )
  );

-- ----------------------------------------------------------------------------
-- TICKET_TIERS TABLE POLICIES
-- ----------------------------------------------------------------------------

-- Public read access (everyone can view ticket tiers)
CREATE POLICY "Ticket tiers are publicly viewable"
  ON ticket_tiers FOR SELECT
  TO authenticated, anon
  USING (true);

-- Insert: Must match events policies EXACTLY
CREATE POLICY "Admins and event managers can insert ticket tiers"
  ON ticket_tiers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      -- Global access: Admin or dev admin
      has_role(auth.uid(), 'admin') OR
      is_dev_admin(auth.uid()) OR

      -- Organization access: Has manage_events permission AND ticket tier's event belongs to their org
      (
        has_permission(auth.uid(), 'manage_events') AND
        EXISTS (
          SELECT 1 FROM events e
          INNER JOIN profiles p ON p.organization_id = e.organization_id
          WHERE e.id = ticket_tiers.event_id
          AND p.user_id = auth.uid()
        )
      )
    )
  );

-- Update: Same permissions as insert
CREATE POLICY "Admins and event managers can update ticket tiers"
  ON ticket_tiers FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      is_dev_admin(auth.uid()) OR
      (
        has_permission(auth.uid(), 'manage_events') AND
        EXISTS (
          SELECT 1 FROM events e
          INNER JOIN profiles p ON p.organization_id = e.organization_id
          WHERE e.id = ticket_tiers.event_id
          AND p.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      is_dev_admin(auth.uid()) OR
      (
        has_permission(auth.uid(), 'manage_events') AND
        EXISTS (
          SELECT 1 FROM events e
          INNER JOIN profiles p ON p.organization_id = e.organization_id
          WHERE e.id = ticket_tiers.event_id
          AND p.user_id = auth.uid()
        )
      )
    )
  );

-- Delete: Same permissions as insert/update
CREATE POLICY "Admins and event managers can delete ticket tiers"
  ON ticket_tiers FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin') OR
      is_dev_admin(auth.uid()) OR
      (
        has_permission(auth.uid(), 'manage_events') AND
        EXISTS (
          SELECT 1 FROM events e
          INNER JOIN profiles p ON p.organization_id = e.organization_id
          WHERE e.id = ticket_tiers.event_id
          AND p.user_id = auth.uid()
        )
      )
    )
  );

-- ----------------------------------------------------------------------------
-- Ensure org_admin and org_staff roles have manage_events permission
-- ----------------------------------------------------------------------------

-- Update org_admin role to include manage_events permission
UPDATE roles
SET permissions = (
  CASE
    WHEN permissions @> '["*"]'::jsonb THEN permissions  -- Already has wildcard
    WHEN permissions @> '["manage_events"]'::jsonb THEN permissions  -- Already has permission
    ELSE permissions || '["manage_events"]'::jsonb  -- Add permission
  END
)
WHERE name = 'org_admin';

-- Update org_staff role to include manage_events permission
UPDATE roles
SET permissions = (
  CASE
    WHEN permissions @> '["*"]'::jsonb THEN permissions  -- Already has wildcard
    WHEN permissions @> '["manage_events"]'::jsonb THEN permissions  -- Already has permission
    ELSE permissions || '["manage_events"]'::jsonb  -- Add permission
  END
)
WHERE name = 'org_staff';
