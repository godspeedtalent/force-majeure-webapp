-- ============================================================================
-- RLS Policy Optimization - Phase 9: Fix Missed Policies
-- ============================================================================
--
-- This migration fixes the 29 policies that Phase 8 missed.
-- These are primarily INSERT policies with WITH CHECK clauses.
--
-- Phase 8 had a logic error in the discovery query (used AND instead of OR
-- for qual/with_check checks), which caused it to miss INSERT-only policies.
--
-- Pattern: Wrap ALL auth.uid(), auth.jwt(), has_role(), is_dev_admin(),
-- has_permission() calls in (select ...) for per-query evaluation.
--
-- Performance Impact: 10-100x faster on INSERT operations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: activity_logs (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Only admins can insert activity logs directly" ON activity_logs;
CREATE POLICY "Only admins can insert activity logs directly"
  ON activity_logs FOR INSERT
  WITH CHECK (
    (has_role((select auth.uid()), 'admin'::text) OR has_role((select auth.uid()), 'developer'::text) OR is_dev_admin((select auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: analytics_sessions (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can insert their own analytics sessions" ON analytics_sessions;
CREATE POLICY "Authenticated users can insert their own analytics sessions"
  ON analytics_sessions FOR INSERT
  WITH CHECK (
    ((user_id IS NULL) OR (user_id = (select auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: app_settings (1 policy) - Only if table exists
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_settings') THEN
    DROP POLICY IF EXISTS "Admins can insert app settings" ON app_settings;
    CREATE POLICY "Admins can insert app settings"
      ON app_settings FOR INSERT
      WITH CHECK (
        (((select auth.uid()) IS NOT NULL) AND (has_role((select auth.uid()), 'admin'::text) OR is_dev_admin((select auth.uid()))))
      );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- TABLE: artists (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can insert their own artist profile" ON artists;
CREATE POLICY "Users can insert their own artist profile"
  ON artists FOR INSERT
  WITH CHECK (
    ((select auth.uid()) = user_id)
  );

-- ----------------------------------------------------------------------------
-- TABLE: chart_labels (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can insert own labels" ON chart_labels;
CREATE POLICY "Users can insert own labels"
  ON chart_labels FOR INSERT
  WITH CHECK (
    ((select auth.uid()) = created_by)
  );

-- ----------------------------------------------------------------------------
-- TABLE: contact_submissions (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Service role and admins can insert contact submissions" ON contact_submissions;
CREATE POLICY "Service role and admins can insert contact submissions"
  ON contact_submissions FOR INSERT
  WITH CHECK (
    (has_role((select auth.uid()), 'admin'::text) OR has_role((select auth.uid()), 'developer'::text) OR is_dev_admin((select auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: event_artists (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and org members can insert event artists" ON event_artists;
CREATE POLICY "Admins and org members can insert event artists"
  ON event_artists FOR INSERT
  WITH CHECK (
    (((select auth.uid()) IS NOT NULL) AND (has_role((select auth.uid()), 'admin'::text) OR is_dev_admin((select auth.uid())) OR (has_permission((select auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((e.id = event_artists.event_id) AND (p.user_id = (select auth.uid()))))))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: events (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users with admin/dev role can insert events" ON events;
CREATE POLICY "Authenticated users with admin/dev role can insert events"
  ON events FOR INSERT
  WITH CHECK (
    (((select auth.uid()) IS NOT NULL) AND (has_role((select auth.uid()), 'admin'::text) OR has_role((select auth.uid()), 'developer'::text)))
  );

-- ----------------------------------------------------------------------------
-- TABLE: group_members (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can add members to groups they belong to" ON group_members;
CREATE POLICY "Users can add members to groups they belong to"
  ON group_members FOR INSERT
  WITH CHECK (
    (((select auth.uid()) = invited_by) AND (EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm.group_id = group_members.group_id) AND (gm.user_id = (select auth.uid()))))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: groups (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can create groups" ON groups;
CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (
    ((select auth.uid()) = creator_id)
  );

-- ----------------------------------------------------------------------------
-- TABLE: guests (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Guests can only be created by system processes" ON guests;
CREATE POLICY "Guests can only be created by system processes"
  ON guests FOR INSERT
  WITH CHECK (
    (has_role((select auth.uid()), 'admin'::text) OR has_role((select auth.uid()), 'developer'::text) OR is_dev_admin((select auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: order_items (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert order_items" ON order_items;
CREATE POLICY "Admins can insert order_items"
  ON order_items FOR INSERT
  WITH CHECK (
    (((select auth.uid()) IS NOT NULL) AND (has_role((select auth.uid()), 'admin'::text) OR has_role((select auth.uid()), 'developer'::text) OR is_dev_admin((select auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: orders (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert orders" ON orders;
CREATE POLICY "Admins can insert orders"
  ON orders FOR INSERT
  WITH CHECK (
    (((select auth.uid()) IS NOT NULL) AND (has_role((select auth.uid()), 'admin'::text) OR has_role((select auth.uid()), 'developer'::text) OR is_dev_admin((select auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: organization_staff (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "organization_staff_insert_policy" ON organization_staff;
CREATE POLICY "organization_staff_insert_policy"
  ON organization_staff FOR INSERT
  WITH CHECK (
    (has_role((select auth.uid()), 'admin'::text) OR has_role((select auth.uid()), 'developer'::text) OR is_dev_admin((select auth.uid())) OR is_organization_admin((select auth.uid()), organization_id))
  );

-- ----------------------------------------------------------------------------
-- TABLE: process_items (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert process items" ON process_items;
CREATE POLICY "Admins can insert process items"
  ON process_items FOR INSERT
  WITH CHECK (
    (has_role((select auth.uid()), 'admin'::text) OR has_role((select auth.uid()), 'developer'::text) OR is_dev_admin((select auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: processes (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert processes" ON processes;
CREATE POLICY "Admins can insert processes"
  ON processes FOR INSERT
  WITH CHECK (
    (has_role((select auth.uid()), 'admin'::text) OR has_role((select auth.uid()), 'developer'::text) OR is_dev_admin((select auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: products (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert products" ON products;
CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  WITH CHECK (
    (((select auth.uid()) IS NOT NULL) AND (has_role((select auth.uid()), 'admin'::text) OR is_dev_admin((select auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: profiles (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    (has_role((select auth.uid()), 'admin'::text) OR has_role((select auth.uid()), 'developer'::text) OR is_dev_admin((select auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: rsvp_scan_events (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can insert RSVP scan events" ON rsvp_scan_events;
CREATE POLICY "Authenticated users can insert RSVP scan events"
  ON rsvp_scan_events FOR INSERT
  WITH CHECK (
    ((scanned_by = (select auth.uid())) AND (has_permission((select auth.uid()), 'scan_tickets'::text) OR has_role((select auth.uid()), 'admin'::text) OR has_role((select auth.uid()), 'developer'::text) OR is_dev_admin((select auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: screening_submissions (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Artists can insert submissions" ON screening_submissions;
CREATE POLICY "Artists can insert submissions"
  ON screening_submissions FOR INSERT
  WITH CHECK (
    (artist_id IN ( SELECT a.id
   FROM artists a
  WHERE (a.user_id = (select auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: tags (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can create tags" ON tags;
CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  WITH CHECK (
    ((select auth.uid()) IS NOT NULL)
  );

-- ----------------------------------------------------------------------------
-- TABLE: ticket_groups (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and devs can insert ticket groups" ON ticket_groups;
CREATE POLICY "Admins and devs can insert ticket groups"
  ON ticket_groups FOR INSERT
  WITH CHECK (
    (((select auth.uid()) IS NOT NULL) AND (has_role((select auth.uid()), 'admin'::text) OR has_role((select auth.uid()), 'developer'::text) OR is_dev_admin((select auth.uid()))))
  );

DROP POLICY IF EXISTS "Org members with manage_events can insert ticket groups" ON ticket_groups;
CREATE POLICY "Org members with manage_events can insert ticket groups"
  ON ticket_groups FOR INSERT
  WITH CHECK (
    (((select auth.uid()) IS NOT NULL) AND has_permission((select auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((e.id = ticket_groups.event_id) AND (p.user_id = (select auth.uid()))))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: ticket_scan_events (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Staff can log scan events" ON ticket_scan_events;
CREATE POLICY "Staff can log scan events"
  ON ticket_scan_events FOR INSERT
  WITH CHECK (
    (has_permission((select auth.uid()), 'scan_tickets'::text) OR has_role((select auth.uid()), 'admin'::text) OR has_role((select auth.uid()), 'developer'::text))
  );

-- ----------------------------------------------------------------------------
-- TABLE: ticket_scans (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Staff can create ticket scans" ON ticket_scans;
CREATE POLICY "Staff can create ticket scans"
  ON ticket_scans FOR INSERT
  WITH CHECK (
    ((select auth.uid()) = scanned_by)
  );

-- ----------------------------------------------------------------------------
-- TABLE: ticket_tiers (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users with admin/dev role can insert ticket tiers" ON ticket_tiers;
CREATE POLICY "Authenticated users with admin/dev role can insert ticket tiers"
  ON ticket_tiers FOR INSERT
  WITH CHECK (
    (((select auth.uid()) IS NOT NULL) AND (has_role((select auth.uid()), 'admin'::text) OR has_role((select auth.uid()), 'developer'::text)))
  );

-- ----------------------------------------------------------------------------
-- TABLE: user_requests (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "user_requests_insert_policy" ON user_requests;
CREATE POLICY "user_requests_insert_policy"
  ON user_requests FOR INSERT
  WITH CHECK (
    ((select auth.uid()) = user_id)
  );

-- ----------------------------------------------------------------------------
-- TABLE: user_roles (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert user_roles" ON user_roles;
CREATE POLICY "Admins can insert user_roles"
  ON user_roles FOR INSERT
  WITH CHECK (
    (has_role((select auth.uid()), 'admin'::text) OR is_dev_admin((select auth.uid())) OR (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text))
  );

-- ----------------------------------------------------------------------------
-- TABLE: webhook_events (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Service role can manage webhooks" ON webhook_events;
CREATE POLICY "Service role can manage webhooks"
  ON webhook_events FOR ALL
  USING (
    (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text)
  );

-- ============================================================================
-- End of Phase 9 Migration
-- ============================================================================
--
-- Verification: Run this query to confirm no unoptimized policies remain
--
-- SELECT COUNT(*) as remaining_unoptimized
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (
--     (qual IS NOT NULL AND qual LIKE '%auth.uid()%' AND qual NOT LIKE '%SELECT auth.%')
--     OR (with_check IS NOT NULL AND with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%SELECT auth.%')
--   );
--
-- Expected result: 0
-- ============================================================================
