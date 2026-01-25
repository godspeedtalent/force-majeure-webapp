-- Fix anonymous user access to event details page
-- This migration addresses issues where unauthenticated users could navigate to event pages
-- but couldn't load certain data due to missing RLS policies and function grants.

-- ============================================================================
-- 1. Grant execute permission on get_event_attendees to anonymous users
-- ============================================================================
-- The guest list data is meant to be public (attendee profiles with guest_list_visible=true),
-- and the underlying table RLS policies already allow anon reads.
-- This grant makes the RPC callable by unauthenticated users so they can see
-- the same attendee information as logged-in users.

GRANT EXECUTE ON FUNCTION get_event_attendees(uuid) TO anon;

-- ============================================================================
-- 2. Add public SELECT policy for organizations
-- ============================================================================
-- Organizations displayed as event partners should be publicly viewable.
-- The existing RLS policies only allow viewing if you're the owner, staff member,
-- or have admin/developer role. This blocks anonymous users from seeing
-- organization data when viewing event pages.
--
-- This policy allows anyone (including anon users) to read basic organization info.

DROP POLICY IF EXISTS "Organizations are publicly readable" ON organizations;
CREATE POLICY "Organizations are publicly readable"
  ON organizations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- 3. Fix guest_list_settings RLS to include invisible events
-- ============================================================================
-- The existing policy only allows reading guest_list_settings for 'published' events.
-- 'invisible' events are still publicly viewable (just not listed in discovery),
-- so their guest list settings should also be readable.

-- Drop the existing policies and recreate with updated condition
DROP POLICY IF EXISTS "Guest list settings are publicly viewable for published events" ON public.guest_list_settings;
DROP POLICY IF EXISTS "Guest list settings are publicly viewable for viewable events" ON public.guest_list_settings;

CREATE POLICY "Guest list settings are publicly viewable for viewable events"
  ON public.guest_list_settings
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = guest_list_settings.event_id
      AND events.status IN ('published', 'invisible', 'test')
    )
  );