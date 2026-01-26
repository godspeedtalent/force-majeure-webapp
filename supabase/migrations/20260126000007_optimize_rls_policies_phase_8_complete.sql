-- ============================================================================
-- RLS Policy Optimization - Phase 8: COMPLETE DATABASE OPTIMIZATION
-- ============================================================================
--
-- This migration fixes ALL remaining unoptimized RLS policies in the database.
-- Total: 259 policies across 91 tables
--
-- Pattern: Wrap ALL auth.uid(), has_role(), is_dev_admin(), has_permission(),
-- is_event_manager(), is_organization_member() calls in (SELECT ...)
-- to ensure per-query evaluation instead of per-row evaluation.
--
-- Performance Impact: 10-100x faster queries, eliminates all performance warnings
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: activity_logs (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view activity logs" ON activity_logs;
CREATE POLICY "Admins can view activity logs"
  ON activity_logs FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text))
  );

DROP POLICY IF EXISTS "Admins have full access to activity logs" ON activity_logs;
CREATE POLICY "Admins have full access to activity logs"
  ON activity_logs FOR ALL
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: activity_logs_archive (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view archived logs" ON activity_logs_archive;
CREATE POLICY "Admins can view archived logs"
  ON activity_logs_archive FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text))
  );

DROP POLICY IF EXISTS "Admins have full access to archived logs" ON activity_logs_archive;
CREATE POLICY "Admins have full access to archived logs"
  ON activity_logs_archive FOR ALL
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: addresses (6 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage all addresses" ON addresses;
CREATE POLICY "Admins can manage all addresses"
  ON addresses FOR ALL
  USING (
    is_dev_admin((SELECT auth.uid()))
  )
  WITH CHECK (
    is_dev_admin((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Org members can view org addresses" ON addresses;
CREATE POLICY "Org members can view org addresses"
  ON addresses FOR SELECT
  USING (
    (organization_id IN ( SELECT profiles.organization_id
   FROM profiles
  WHERE (profiles.id = (SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Org owners can manage org addresses" ON addresses;
CREATE POLICY "Org owners can manage org addresses"
  ON addresses FOR ALL
  USING (
    (organization_id IN ( SELECT organizations.id
   FROM organizations
  WHERE (organizations.owner_id = (SELECT auth.uid()))))
  )
  WITH CHECK (
    (organization_id IN ( SELECT organizations.id
   FROM organizations
  WHERE (organizations.owner_id = (SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Users can manage own profile addresses" ON addresses;
CREATE POLICY "Users can manage own profile addresses"
  ON addresses FOR ALL
  USING (
    (profile_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    (profile_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can manage their own addresses" ON addresses;
CREATE POLICY "Users can manage their own addresses"
  ON addresses FOR ALL
  USING (
    (profile_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    (profile_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can view linked guest addresses" ON addresses;
CREATE POLICY "Users can view linked guest addresses"
  ON addresses FOR SELECT
  USING (
    (guest_id IN ( SELECT guests.id
   FROM guests
  WHERE (guests.profile_id = (SELECT auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: analytics_funnel_events (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view all funnel events" ON analytics_funnel_events;
CREATE POLICY "Admins can view all funnel events"
  ON analytics_funnel_events FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Only admins and developers can view analytics funnel events" ON analytics_funnel_events;
CREATE POLICY "Only admins and developers can view analytics funnel events"
  ON analytics_funnel_events FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: analytics_page_views (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view all page views" ON analytics_page_views;
CREATE POLICY "Admins can view all page views"
  ON analytics_page_views FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Only admins and developers can view analytics page views" ON analytics_page_views;
CREATE POLICY "Only admins and developers can view analytics page views"
  ON analytics_page_views FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: analytics_performance (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view all performance metrics" ON analytics_performance;
CREATE POLICY "Admins can view all performance metrics"
  ON analytics_performance FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Only admins and developers can view analytics performance" ON analytics_performance;
CREATE POLICY "Only admins and developers can view analytics performance"
  ON analytics_performance FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: analytics_sessions (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view all sessions" ON analytics_sessions;
CREATE POLICY "Admins can view all sessions"
  ON analytics_sessions FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Only admins and developers can view analytics sessions" ON analytics_sessions;
CREATE POLICY "Only admins and developers can view analytics sessions"
  ON analytics_sessions FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Only admins can delete analytics sessions" ON analytics_sessions;
CREATE POLICY "Only admins can delete analytics sessions"
  ON analytics_sessions FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Only admins can update analytics sessions" ON analytics_sessions;
CREATE POLICY "Only admins can update analytics sessions"
  ON analytics_sessions FOR UPDATE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: app_settings (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete app settings" ON app_settings;
CREATE POLICY "Admins can delete app settings"
  ON app_settings FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update app settings" ON app_settings;
CREATE POLICY "Admins can update app settings"
  ON app_settings FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: artist_genres (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and developers can manage artist genres" ON artist_genres;
CREATE POLICY "Admins and developers can manage artist genres"
  ON artist_genres FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text)))
  );

-- ----------------------------------------------------------------------------
-- TABLE: artist_recordings (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete recordings" ON artist_recordings;
CREATE POLICY "Admins can delete recordings"
  ON artist_recordings FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR has_role((SELECT auth.uid()), 'org_admin'::text)))
  );

DROP POLICY IF EXISTS "Admins can manage recordings" ON artist_recordings;
CREATE POLICY "Admins can manage recordings"
  ON artist_recordings FOR ALL
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'org_admin'::text, 'developer'::text])))))
  );

DROP POLICY IF EXISTS "Admins can update recordings" ON artist_recordings;
CREATE POLICY "Admins can update recordings"
  ON artist_recordings FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR has_role((SELECT auth.uid()), 'org_admin'::text)))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR has_role((SELECT auth.uid()), 'org_admin'::text)))
  );

-- ----------------------------------------------------------------------------
-- TABLE: artist_registrations (7 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and developers can delete artist registrations" ON artist_registrations;
CREATE POLICY "Admins and developers can delete artist registrations"
  ON artist_registrations FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR has_role((SELECT auth.uid()), 'org_admin'::text))
  );

DROP POLICY IF EXISTS "Admins and developers can update artist registrations" ON artist_registrations;
CREATE POLICY "Admins and developers can update artist registrations"
  ON artist_registrations FOR UPDATE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR has_role((SELECT auth.uid()), 'org_admin'::text))
  )
  WITH CHECK (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR has_role((SELECT auth.uid()), 'org_admin'::text))
  );

DROP POLICY IF EXISTS "Admins and developers can view all artist registrations" ON artist_registrations;
CREATE POLICY "Admins and developers can view all artist registrations"
  ON artist_registrations FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR has_role((SELECT auth.uid()), 'org_admin'::text))
  );

DROP POLICY IF EXISTS "Admins can update artist registrations" ON artist_registrations;
CREATE POLICY "Admins can update artist registrations"
  ON artist_registrations FOR UPDATE
  USING (
    has_role((SELECT auth.uid()), 'admin'::text)
  );

DROP POLICY IF EXISTS "Admins can view all artist registrations" ON artist_registrations;
CREATE POLICY "Admins can view all artist registrations"
  ON artist_registrations FOR SELECT
  USING (
    has_role((SELECT auth.uid()), 'admin'::text)
  );

DROP POLICY IF EXISTS "Users can update own pending registration" ON artist_registrations;
CREATE POLICY "Users can update own pending registration"
  ON artist_registrations FOR UPDATE
  USING (
    (((SELECT auth.uid()) = user_id) AND (status = 'pending'::text))
  )
  WITH CHECK (
    (((SELECT auth.uid()) = user_id) AND (status = 'pending'::text))
  );

DROP POLICY IF EXISTS "Users can view their own artist registrations" ON artist_registrations;
CREATE POLICY "Users can view their own artist registrations"
  ON artist_registrations FOR SELECT
  USING (
    ((SELECT auth.uid()) = user_id)
  );

-- ----------------------------------------------------------------------------
-- TABLE: artists (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete artists" ON artists;
CREATE POLICY "Admins can delete artists"
  ON artists FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update artists" ON artists;
CREATE POLICY "Admins can update artists"
  ON artists FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Artists can update their own profile" ON artists;
CREATE POLICY "Artists can update their own profile"
  ON artists FOR UPDATE
  USING (
    ((SELECT auth.uid()) = user_id)
  )
  WITH CHECK (
    ((SELECT auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Users can view their linked artist" ON artists;
CREATE POLICY "Users can view their linked artist"
  ON artists FOR SELECT
  USING (
    (((SELECT auth.uid()) = user_id) OR (user_id IS NULL))
  );

-- ----------------------------------------------------------------------------
-- TABLE: chart_labels (7 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete any labels" ON chart_labels;
CREATE POLICY "Admins can delete any labels"
  ON chart_labels FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update any labels" ON chart_labels;
CREATE POLICY "Admins can update any labels"
  ON chart_labels FOR UPDATE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can view all labels" ON chart_labels;
CREATE POLICY "Admins can view all labels"
  ON chart_labels FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text))
  );

DROP POLICY IF EXISTS "Users can delete own labels" ON chart_labels;
CREATE POLICY "Users can delete own labels"
  ON chart_labels FOR DELETE
  USING (
    ((SELECT auth.uid()) = created_by)
  );

DROP POLICY IF EXISTS "Users can manage own labels" ON chart_labels;
CREATE POLICY "Users can manage own labels"
  ON chart_labels FOR ALL
  USING (
    ((SELECT auth.uid()) = created_by)
  )
  WITH CHECK (
    ((SELECT auth.uid()) = created_by)
  );

DROP POLICY IF EXISTS "Users can update own labels" ON chart_labels;
CREATE POLICY "Users can update own labels"
  ON chart_labels FOR UPDATE
  USING (
    ((SELECT auth.uid()) = created_by)
  )
  WITH CHECK (
    ((SELECT auth.uid()) = created_by)
  );

DROP POLICY IF EXISTS "Users can view own labels" ON chart_labels;
CREATE POLICY "Users can view own labels"
  ON chart_labels FOR SELECT
  USING (
    ((SELECT auth.uid()) = created_by)
  );

-- ----------------------------------------------------------------------------
-- TABLE: cities (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete cities" ON cities;
CREATE POLICY "Admins can delete cities"
  ON cities FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update cities" ON cities;
CREATE POLICY "Admins can update cities"
  ON cities FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: column_customizations (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Only admins can modify column customizations" ON column_customizations;
CREATE POLICY "Only admins can modify column customizations"
  ON column_customizations FOR ALL
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: comp_tickets (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage all comp tickets" ON comp_tickets;
CREATE POLICY "Admins can manage all comp tickets"
  ON comp_tickets FOR ALL
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Users can view own comp tickets" ON comp_tickets;
CREATE POLICY "Users can view own comp tickets"
  ON comp_tickets FOR SELECT
  USING (
    ((recipient_user_id = (SELECT auth.uid())) OR (recipient_email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = (SELECT auth.uid()))))::text))
  );

-- ----------------------------------------------------------------------------
-- TABLE: contact_submissions (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete contact submissions" ON contact_submissions;
CREATE POLICY "Admins can delete contact submissions"
  ON contact_submissions FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update contact submissions" ON contact_submissions;
CREATE POLICY "Admins can update contact submissions"
  ON contact_submissions FOR UPDATE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can view all contact submissions" ON contact_submissions;
CREATE POLICY "Admins can view all contact submissions"
  ON contact_submissions FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Only admins can view contact submissions" ON contact_submissions;
CREATE POLICY "Only admins can view contact submissions"
  ON contact_submissions FOR ALL
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: datagrid_configs (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can delete own datagrid configs" ON datagrid_configs;
CREATE POLICY "Users can delete own datagrid configs"
  ON datagrid_configs FOR DELETE
  USING (
    ((SELECT auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Users can update own datagrid configs" ON datagrid_configs;
CREATE POLICY "Users can update own datagrid configs"
  ON datagrid_configs FOR UPDATE
  USING (
    ((SELECT auth.uid()) = user_id)
  )
  WITH CHECK (
    ((SELECT auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Users can view own datagrid configs" ON datagrid_configs;
CREATE POLICY "Users can view own datagrid configs"
  ON datagrid_configs FOR SELECT
  USING (
    ((SELECT auth.uid()) = user_id)
  );

-- ----------------------------------------------------------------------------
-- TABLE: dev_bookmarks (6 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view all bookmarks" ON dev_bookmarks;
CREATE POLICY "Admins can view all bookmarks"
  ON dev_bookmarks FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Developers can manage own bookmarks" ON dev_bookmarks;
CREATE POLICY "Developers can manage own bookmarks"
  ON dev_bookmarks FOR ALL
  USING (
    ((SELECT auth.uid()) = user_id)
  )
  WITH CHECK (
    ((SELECT auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Developers can view bookmarks" ON dev_bookmarks;
CREATE POLICY "Developers can view bookmarks"
  ON dev_bookmarks FOR SELECT
  USING (
    ((SELECT auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON dev_bookmarks;
CREATE POLICY "Users can delete own bookmarks"
  ON dev_bookmarks FOR DELETE
  USING (
    ((SELECT auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Users can update own bookmarks" ON dev_bookmarks;
CREATE POLICY "Users can update own bookmarks"
  ON dev_bookmarks FOR UPDATE
  USING (
    ((SELECT auth.uid()) = user_id)
  )
  WITH CHECK (
    ((SELECT auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Users can view own bookmarks" ON dev_bookmarks;
CREATE POLICY "Users can view own bookmarks"
  ON dev_bookmarks FOR SELECT
  USING (
    ((SELECT auth.uid()) = user_id)
  );

-- ----------------------------------------------------------------------------
-- TABLE: dev_notes (5 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Developers can delete their own dev notes" ON dev_notes;
CREATE POLICY "Developers can delete their own dev notes"
  ON dev_notes FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (author_id = (SELECT auth.uid())) AND (has_role((SELECT auth.uid()), 'developer'::text) OR has_role((SELECT auth.uid()), 'admin'::text)))
  );

DROP POLICY IF EXISTS "Developers can update their own dev notes" ON dev_notes;
CREATE POLICY "Developers can update their own dev notes"
  ON dev_notes FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (author_id = (SELECT auth.uid())) AND (has_role((SELECT auth.uid()), 'developer'::text) OR has_role((SELECT auth.uid()), 'admin'::text)))
  )
  WITH CHECK (
    (author_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Developers can view all dev notes" ON dev_notes;
CREATE POLICY "Developers can view all dev notes"
  ON dev_notes FOR SELECT
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'developer'::text) OR has_role((SELECT auth.uid()), 'admin'::text)))
  );

DROP POLICY IF EXISTS "Staff can delete dev notes" ON dev_notes;
CREATE POLICY "Staff can delete dev notes"
  ON dev_notes FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'developer'::text) OR has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'fm_staff'::text)) AND ((author_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::text)))
  );

DROP POLICY IF EXISTS "Staff can update dev notes" ON dev_notes;
CREATE POLICY "Staff can update dev notes"
  ON dev_notes FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'developer'::text) OR has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'fm_staff'::text)) AND ((author_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::text)))
  )
  WITH CHECK (
    ((author_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::text))
  );

-- ----------------------------------------------------------------------------
-- TABLE: entity_fee_items (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "entity_fee_items_delete_policy" ON entity_fee_items;
CREATE POLICY "entity_fee_items_delete_policy"
  ON entity_fee_items FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'org_admin'::text))
  );

DROP POLICY IF EXISTS "entity_fee_items_update_policy" ON entity_fee_items;
CREATE POLICY "entity_fee_items_update_policy"
  ON entity_fee_items FOR UPDATE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'org_admin'::text))
  );

-- ----------------------------------------------------------------------------
-- TABLE: environments (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "admin_manage_environments" ON environments;
CREATE POLICY "admin_manage_environments"
  ON environments FOR ALL
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((r.id = ur.role_id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  )
  WITH CHECK (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((r.id = ur.role_id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  );

DROP POLICY IF EXISTS "environments_admin_policy" ON environments;
CREATE POLICY "environments_admin_policy"
  ON environments FOR ALL
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = 'admin'::text))))
  )
  WITH CHECK (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = 'admin'::text))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: error_logs (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete error logs" ON error_logs;
CREATE POLICY "Admins can delete error logs"
  ON error_logs FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text))
  );

DROP POLICY IF EXISTS "Admins can view error logs" ON error_logs;
CREATE POLICY "Admins can view error logs"
  ON error_logs FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text))
  );

-- ----------------------------------------------------------------------------
-- TABLE: error_logs_archive (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view archived error logs" ON error_logs_archive;
CREATE POLICY "Admins can view archived error logs"
  ON error_logs_archive FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text))
  );

-- ----------------------------------------------------------------------------
-- TABLE: event_artists (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and org members can delete event artists" ON event_artists;
CREATE POLICY "Admins and org members can delete event artists"
  ON event_artists FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())) OR (has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((e.id = event_artists.event_id) AND (p.user_id = (SELECT auth.uid()))))))))
  );

DROP POLICY IF EXISTS "Admins and org members can update event artists" ON event_artists;
CREATE POLICY "Admins and org members can update event artists"
  ON event_artists FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())) OR (has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((e.id = event_artists.event_id) AND (p.user_id = (SELECT auth.uid()))))))))
  );

DROP POLICY IF EXISTS "Admins can manage event artists" ON event_artists;
CREATE POLICY "Admins can manage event artists"
  ON event_artists FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: event_images (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and developers can delete event images" ON event_images;
CREATE POLICY "Admins and developers can delete event images"
  ON event_images FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text)))
  );

DROP POLICY IF EXISTS "Admins and developers can update event images" ON event_images;
CREATE POLICY "Admins and developers can update event images"
  ON event_images FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text)))
  );

-- ----------------------------------------------------------------------------
-- TABLE: event_partners (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "event_partners_delete_policy" ON event_partners;
CREATE POLICY "event_partners_delete_policy"
  ON event_partners FOR DELETE
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  );

DROP POLICY IF EXISTS "event_partners_update_policy" ON event_partners;
CREATE POLICY "event_partners_update_policy"
  ON event_partners FOR UPDATE
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  )
  WITH CHECK (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: event_promo_codes (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage event promo codes" ON event_promo_codes;
CREATE POLICY "Admins can manage event promo codes"
  ON event_promo_codes FOR ALL
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: event_rsvps (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage all RSVPs" ON event_rsvps;
CREATE POLICY "Admins can manage all RSVPs"
  ON event_rsvps FOR ALL
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Event managers can manage event RSVPs" ON event_rsvps;
CREATE POLICY "Event managers can manage event RSVPs"
  ON event_rsvps FOR ALL
  USING (
    is_event_manager((SELECT auth.uid()), event_id)
  );

DROP POLICY IF EXISTS "Users can delete own RSVP" ON event_rsvps;
CREATE POLICY "Users can delete own RSVP"
  ON event_rsvps FOR DELETE
  USING (
    ((SELECT auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Users can update own RSVP" ON event_rsvps;
CREATE POLICY "Users can update own RSVP"
  ON event_rsvps FOR UPDATE
  USING (
    ((SELECT auth.uid()) = user_id)
  )
  WITH CHECK (
    ((SELECT auth.uid()) = user_id)
  );

-- ----------------------------------------------------------------------------
-- TABLE: event_staff (4 policies - using is_event_manager() SECURITY DEFINER to avoid recursion)
-- NOTE: These policies use is_event_manager() SECURITY DEFINER function to avoid
-- infinite recursion when querying event_staff.
-- DO NOT add policies that query event_staff directly from within these policies.
-- ----------------------------------------------------------------------------

-- Drop ALL old recursive policies first
DROP POLICY IF EXISTS "Admins can delete staff assignments" ON event_staff;
DROP POLICY IF EXISTS "Admins can update staff assignments" ON event_staff;
DROP POLICY IF EXISTS "Admins can view all staff assignments" ON event_staff;
DROP POLICY IF EXISTS "Event managers can manage their event staff" ON event_staff;
DROP POLICY IF EXISTS "Org owners can view their org staff assignments" ON event_staff;
DROP POLICY IF EXISTS "Users can view their staff assignments" ON event_staff;

-- SELECT: Admins, event managers (via SECURITY DEFINER), org owners, and own assignments
DROP POLICY IF EXISTS "event_staff_select_policy" ON event_staff;
CREATE POLICY "event_staff_select_policy"
  ON event_staff FOR SELECT
  USING (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    user_id = (SELECT auth.uid()) OR
    is_event_manager((SELECT auth.uid()), event_id) OR
    organization_id IN (SELECT id FROM organizations WHERE owner_id = (SELECT auth.uid()))
  );

-- INSERT: Admins and event managers only
DROP POLICY IF EXISTS "event_staff_insert_policy" ON event_staff;
CREATE POLICY "event_staff_insert_policy"
  ON event_staff FOR INSERT
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_event_manager((SELECT auth.uid()), event_id)
  );

-- UPDATE: Admins and event managers only
DROP POLICY IF EXISTS "event_staff_update_policy" ON event_staff;
CREATE POLICY "event_staff_update_policy"
  ON event_staff FOR UPDATE
  USING (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_event_manager((SELECT auth.uid()), event_id)
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_event_manager((SELECT auth.uid()), event_id)
  );

-- DELETE: Admins and event managers only
DROP POLICY IF EXISTS "event_staff_delete_policy" ON event_staff;
CREATE POLICY "event_staff_delete_policy"
  ON event_staff FOR DELETE
  USING (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_event_manager((SELECT auth.uid()), event_id)
  );

-- ----------------------------------------------------------------------------
-- TABLE: event_views (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view event analytics" ON event_views;
CREATE POLICY "Admins can view event analytics"
  ON event_views FOR SELECT
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text)))
  );

DROP POLICY IF EXISTS "Only admins can delete event views" ON event_views;
CREATE POLICY "Only admins can delete event views"
  ON event_views FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND has_role((SELECT auth.uid()), 'admin'::text))
  );

-- ----------------------------------------------------------------------------
-- TABLE: events (7 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and devs can delete events" ON events;
CREATE POLICY "Admins and devs can delete events"
  ON events FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins and devs can update events" ON events;
CREATE POLICY "Admins and devs can update events"
  ON events FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can delete events" ON events;
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update events" ON events;
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Org members with manage_events can delete events" ON events;
CREATE POLICY "Org members with manage_events can delete events"
  ON events FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND (profiles.organization_id = events.organization_id)))))
  );

DROP POLICY IF EXISTS "Org members with manage_events can update events" ON events;
CREATE POLICY "Org members with manage_events can update events"
  ON events FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND (profiles.organization_id = events.organization_id)))))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND (profiles.organization_id = events.organization_id)))))
  );

DROP POLICY IF EXISTS "Privileged users can view all events" ON events;
CREATE POLICY "Privileged users can view all events"
  ON events FOR SELECT
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())) OR (has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND (profiles.organization_id = events.organization_id)))))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: exclusive_content_grants (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete content grants" ON exclusive_content_grants;
CREATE POLICY "Admins can delete content grants"
  ON exclusive_content_grants FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update content grants" ON exclusive_content_grants;
CREATE POLICY "Admins can update content grants"
  ON exclusive_content_grants FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Users can view their own content grants" ON exclusive_content_grants;
CREATE POLICY "Users can view their own content grants"
  ON exclusive_content_grants FOR SELECT
  USING (
    (user_id = (SELECT auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- TABLE: feature_flags (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete feature flags" ON feature_flags;
CREATE POLICY "Admins can delete feature flags"
  ON feature_flags FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update feature flags" ON feature_flags;
CREATE POLICY "Admins can update feature flags"
  ON feature_flags FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: genres (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and developers can manage genres" ON genres;
CREATE POLICY "Admins and developers can manage genres"
  ON genres FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text)))
  );

-- ----------------------------------------------------------------------------
-- TABLE: group_members (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  USING (
    (EXISTS ( SELECT 1
   FROM group_members gm
  WHERE ((gm.group_id = group_members.group_id) AND (gm.user_id = (SELECT auth.uid())))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: groups (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;
CREATE POLICY "Group creators can update their groups"
  ON groups FOR UPDATE
  USING (
    ((SELECT auth.uid()) = creator_id)
  );

DROP POLICY IF EXISTS "Users can view groups they are members of" ON groups;
CREATE POLICY "Users can view groups they are members of"
  ON groups FOR SELECT
  USING (
    (EXISTS ( SELECT 1
   FROM group_members
  WHERE ((group_members.group_id = groups.id) AND (group_members.user_id = (SELECT auth.uid())))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: guest_list_settings (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and developers can manage guest list settings" ON guest_list_settings;
CREATE POLICY "Admins and developers can manage guest list settings"
  ON guest_list_settings FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Org members can manage their org's guest list settings" ON guest_list_settings;
CREATE POLICY "Org members can manage their org's guest list settings"
  ON guest_list_settings FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((e.id = guest_list_settings.event_id) AND (p.user_id = (SELECT auth.uid()))))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: guests (6 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage all guests" ON guests;
CREATE POLICY "Admins can manage all guests"
  ON guests FOR ALL
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can manage guests" ON guests;
CREATE POLICY "Admins can manage guests"
  ON guests FOR ALL
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Users can read guests from their orders" ON guests;
CREATE POLICY "Users can read guests from their orders"
  ON guests FOR SELECT
  USING (
    (id IN ( SELECT orders.guest_id
   FROM orders
  WHERE ((orders.user_id = (SELECT auth.uid())) AND (orders.guest_id IS NOT NULL))))
  );

DROP POLICY IF EXISTS "Users can update own guest records" ON guests;
CREATE POLICY "Users can update own guest records"
  ON guests FOR UPDATE
  USING (
    (profile_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    (profile_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can view guests from their orders" ON guests;
CREATE POLICY "Users can view guests from their orders"
  ON guests FOR SELECT
  USING (
    (EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.guest_id = guests.id) AND (o.user_id = (SELECT auth.uid())))))
  );

DROP POLICY IF EXISTS "Users can view own guest records" ON guests;
CREATE POLICY "Users can view own guest records"
  ON guests FOR SELECT
  USING (
    (profile_id = (SELECT auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- TABLE: link_clicks (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and devs can view link clicks" ON link_clicks;
CREATE POLICY "Admins and devs can view link clicks"
  ON link_clicks FOR SELECT
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Org members with manage_events can view link clicks" ON link_clicks;
CREATE POLICY "Org members with manage_events can view link clicks"
  ON link_clicks FOR SELECT
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM ((tracking_links tl
     JOIN events e ON ((e.id = tl.event_id)))
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((tl.id = link_clicks.link_id) AND (p.user_id = (SELECT auth.uid()))))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: media_galleries (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete galleries" ON media_galleries;
CREATE POLICY "Admins can delete galleries"
  ON media_galleries FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text)))
  );

DROP POLICY IF EXISTS "Admins can update galleries" ON media_galleries;
CREATE POLICY "Admins can update galleries"
  ON media_galleries FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text)))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text)))
  );

DROP POLICY IF EXISTS "Admins can view all galleries" ON media_galleries;
CREATE POLICY "Admins can view all galleries"
  ON media_galleries FOR SELECT
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text)))
  );

-- ----------------------------------------------------------------------------
-- TABLE: media_items (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete media items" ON media_items;
CREATE POLICY "Admins can delete media items"
  ON media_items FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text)))
  );

DROP POLICY IF EXISTS "Admins can update media items" ON media_items;
CREATE POLICY "Admins can update media items"
  ON media_items FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text)))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text)))
  );

DROP POLICY IF EXISTS "Admins can view all media items" ON media_items;
CREATE POLICY "Admins can view all media items"
  ON media_items FOR SELECT
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text)))
  );

-- ----------------------------------------------------------------------------
-- TABLE: order_items (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete order_items" ON order_items;
CREATE POLICY "Admins can delete order_items"
  ON order_items FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update order_items" ON order_items;
CREATE POLICY "Admins can update order_items"
  ON order_items FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Users can view items for their orders" ON order_items;
CREATE POLICY "Users can view items for their orders"
  ON order_items FOR SELECT
  USING (
    (order_id IN ( SELECT orders.id
   FROM orders
  WHERE (orders.user_id = (SELECT auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: orders (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (
    (user_id = (SELECT auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- TABLE: organization_staff (4 policies - using SECURITY DEFINER functions to avoid recursion)
-- NOTE: These policies use get_user_organization_ids() and is_organization_admin()
-- SECURITY DEFINER functions to avoid infinite recursion when querying organization_staff.
-- DO NOT add policies that query organization_staff directly from within these policies.
-- ----------------------------------------------------------------------------

-- Drop ALL old recursive policies first
DROP POLICY IF EXISTS "Admins can view all org staff" ON organization_staff;
DROP POLICY IF EXISTS "Org admins can delete staff" ON organization_staff;
DROP POLICY IF EXISTS "Org admins can update staff" ON organization_staff;
DROP POLICY IF EXISTS "Org owners can delete staff" ON organization_staff;
DROP POLICY IF EXISTS "Org owners can update staff" ON organization_staff;
DROP POLICY IF EXISTS "Org owners can view staff" ON organization_staff;
DROP POLICY IF EXISTS "Org staff can view staff list" ON organization_staff;
DROP POLICY IF EXISTS "System admins can delete all org staff" ON organization_staff;
DROP POLICY IF EXISTS "System admins can update all org staff" ON organization_staff;

-- SELECT: Uses get_user_organization_ids() SECURITY DEFINER function to avoid recursion
DROP POLICY IF EXISTS "organization_staff_select_policy" ON organization_staff;
CREATE POLICY "organization_staff_select_policy"
  ON organization_staff FOR SELECT
  USING (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    organization_id = ANY(get_user_organization_ids((SELECT auth.uid())))
  );

-- INSERT: Uses is_organization_admin() SECURITY DEFINER function to avoid recursion
DROP POLICY IF EXISTS "organization_staff_insert_policy" ON organization_staff;
CREATE POLICY "organization_staff_insert_policy"
  ON organization_staff FOR INSERT
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_organization_admin((SELECT auth.uid()), organization_id)
  );

-- UPDATE: Uses is_organization_admin() SECURITY DEFINER function to avoid recursion
DROP POLICY IF EXISTS "organization_staff_update_policy" ON organization_staff;
CREATE POLICY "organization_staff_update_policy"
  ON organization_staff FOR UPDATE
  USING (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_organization_admin((SELECT auth.uid()), organization_id)
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_organization_admin((SELECT auth.uid()), organization_id)
  );

-- DELETE: Uses is_organization_admin() SECURITY DEFINER function to avoid recursion
DROP POLICY IF EXISTS "organization_staff_delete_policy" ON organization_staff;
CREATE POLICY "organization_staff_delete_policy"
  ON organization_staff FOR DELETE
  USING (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid())) OR
    is_organization_admin((SELECT auth.uid()), organization_id)
  );

-- ----------------------------------------------------------------------------
-- TABLE: organizations (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Organization owners can delete their organizations" ON organizations;
CREATE POLICY "Organization owners can delete their organizations"
  ON organizations FOR DELETE
  USING (
    ((SELECT auth.uid()) = owner_id)
  );

DROP POLICY IF EXISTS "Organization owners can update their organizations" ON organizations;
CREATE POLICY "Organization owners can update their organizations"
  ON organizations FOR UPDATE
  USING (
    ((SELECT auth.uid()) = owner_id)
  )
  WITH CHECK (
    ((SELECT auth.uid()) = owner_id)
  );

DROP POLICY IF EXISTS "Users can view organizations they own or belong to" ON organizations;
CREATE POLICY "Users can view organizations they own or belong to"
  ON organizations FOR SELECT
  USING (
    (((SELECT auth.uid()) = owner_id) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (SELECT auth.uid())) AND (profiles.organization_id = organizations.id)))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: pending_order_links (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view pending order links" ON pending_order_links;
CREATE POLICY "Admins can view pending order links"
  ON pending_order_links FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text))
  );

-- ----------------------------------------------------------------------------
-- TABLE: process_items (6 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete process items" ON process_items;
CREATE POLICY "Admins can delete process items"
  ON process_items FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update process items" ON process_items;
CREATE POLICY "Admins can update process items"
  ON process_items FOR UPDATE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can view all process items" ON process_items;
CREATE POLICY "Admins can view all process items"
  ON process_items FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text))
  );

DROP POLICY IF EXISTS "Users can manage items for own processes" ON process_items;
CREATE POLICY "Users can manage items for own processes"
  ON process_items FOR ALL
  USING (
    (process_id IN ( SELECT processes.id
   FROM processes
  WHERE (processes.created_by = (SELECT auth.uid()))))
  )
  WITH CHECK (
    (process_id IN ( SELECT processes.id
   FROM processes
  WHERE (processes.created_by = (SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Users can view items for own processes" ON process_items;
CREATE POLICY "Users can view items for own processes"
  ON process_items FOR SELECT
  USING (
    (process_id IN ( SELECT processes.id
   FROM processes
  WHERE (processes.created_by = (SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Users can view own process items" ON process_items;
CREATE POLICY "Users can view own process items"
  ON process_items FOR SELECT
  USING (
    (process_id IN ( SELECT processes.id
   FROM processes
  WHERE (processes.created_by = (SELECT auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: processes (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete processes" ON processes;
CREATE POLICY "Admins can delete processes"
  ON processes FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update processes" ON processes;
CREATE POLICY "Admins can update processes"
  ON processes FOR UPDATE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can view all processes" ON processes;
CREATE POLICY "Admins can view all processes"
  ON processes FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text))
  );

DROP POLICY IF EXISTS "Users can view own processes" ON processes;
CREATE POLICY "Users can view own processes"
  ON processes FOR SELECT
  USING (
    ((SELECT auth.uid()) = created_by)
  );

-- ----------------------------------------------------------------------------
-- TABLE: products (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: profiles (5 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (
    ((SELECT auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (
    ((SELECT auth.uid()) = user_id)
  );

-- ----------------------------------------------------------------------------
-- TABLE: promo_code_groups (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage promo code groups" ON promo_code_groups;
CREATE POLICY "Admins can manage promo code groups"
  ON promo_code_groups FOR ALL
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: promo_code_tiers (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage promo code tiers" ON promo_code_tiers;
CREATE POLICY "Admins can manage promo code tiers"
  ON promo_code_tiers FOR ALL
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: promo_codes (5 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete promo codes" ON promo_codes;
CREATE POLICY "Admins can delete promo codes"
  ON promo_codes FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update promo codes" ON promo_codes;
CREATE POLICY "Admins can update promo codes"
  ON promo_codes FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can view all promo codes" ON promo_codes;
CREATE POLICY "Admins can view all promo codes"
  ON promo_codes FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Event managers can view event promo codes" ON promo_codes;
CREATE POLICY "Event managers can view event promo codes"
  ON promo_codes FOR SELECT
  USING (
    (id IN ( SELECT epc.promo_code_id
   FROM (event_promo_codes epc
     JOIN events e ON ((e.id = epc.event_id)))
  WHERE is_event_manager((SELECT auth.uid()), e.id)))
  );

DROP POLICY IF EXISTS "Org admins can view org event promo codes" ON promo_codes;
CREATE POLICY "Org admins can view org event promo codes"
  ON promo_codes FOR SELECT
  USING (
    (id IN ( SELECT epc.promo_code_id
   FROM ((event_promo_codes epc
     JOIN events e ON ((e.id = epc.event_id)))
     JOIN organizations o ON ((e.organization_id = o.id)))
  WHERE is_organization_admin((SELECT auth.uid()), o.id)))
  );

-- ----------------------------------------------------------------------------
-- TABLE: queue_configurations (2 policies - using is_event_manager() SECURITY DEFINER to avoid recursion)
-- NOTE: Uses is_event_manager() instead of querying event_staff directly to avoid recursion.
-- ----------------------------------------------------------------------------

-- Drop old policies
DROP POLICY IF EXISTS "Admins can delete queue configurations" ON queue_configurations;
DROP POLICY IF EXISTS "Admins can manage queue configurations" ON queue_configurations;
DROP POLICY IF EXISTS "Admins can update queue configurations" ON queue_configurations;
DROP POLICY IF EXISTS "Event managers can manage queue configurations" ON queue_configurations;

-- Admin policy
CREATE POLICY "Admins can manage queue configurations"
  ON queue_configurations FOR ALL
  USING (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid()))
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin'::text) OR
    has_role((SELECT auth.uid()), 'developer'::text) OR
    is_dev_admin((SELECT auth.uid()))
  );

-- Event managers and org owners policy (uses is_event_manager SECURITY DEFINER function)
CREATE POLICY "Event managers can manage queue configurations"
  ON queue_configurations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = queue_configurations.event_id
      AND (
        EXISTS (SELECT 1 FROM organizations o WHERE o.id = e.organization_id AND o.owner_id = (SELECT auth.uid()))
        OR is_event_manager((SELECT auth.uid()), e.id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = queue_configurations.event_id
      AND (
        EXISTS (SELECT 1 FROM organizations o WHERE o.id = e.organization_id AND o.owner_id = (SELECT auth.uid()))
        OR is_event_manager((SELECT auth.uid()), e.id)
      )
    )
  );

-- ----------------------------------------------------------------------------
-- TABLE: rave_family (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can delete their own family connections" ON rave_family;
CREATE POLICY "Users can delete their own family connections"
  ON rave_family FOR DELETE
  USING (
    ((SELECT auth.uid()) = user_id)
  );

DROP POLICY IF EXISTS "Users can view their own family connections" ON rave_family;
CREATE POLICY "Users can view their own family connections"
  ON rave_family FOR SELECT
  USING (
    (((SELECT auth.uid()) = user_id) OR ((SELECT auth.uid()) = family_member_id))
  );

-- ----------------------------------------------------------------------------
-- TABLE: report_configurations (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage report configurations" ON report_configurations;
CREATE POLICY "Admins can manage report configurations"
  ON report_configurations FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Org admins can manage their org's report configurations" ON report_configurations;
CREATE POLICY "Org admins can manage their org's report configurations"
  ON report_configurations FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((e.id = report_configurations.event_id) AND (p.user_id = (SELECT auth.uid()))))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: report_history (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view report history" ON report_history;
CREATE POLICY "Admins can view report history"
  ON report_history FOR SELECT
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Org admins can view their org's report history" ON report_history;
CREATE POLICY "Org admins can view their org's report history"
  ON report_history FOR SELECT
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM ((report_configurations rc
     JOIN events e ON ((e.id = rc.event_id)))
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((rc.id = report_history.report_config_id) AND (p.user_id = (SELECT auth.uid()))))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: report_recipients (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage report recipients" ON report_recipients;
CREATE POLICY "Admins can manage report recipients"
  ON report_recipients FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Org admins can manage their org's report recipients" ON report_recipients;
CREATE POLICY "Org admins can manage their org's report recipients"
  ON report_recipients FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM ((report_configurations rc
     JOIN events e ON ((e.id = rc.event_id)))
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((rc.id = report_recipients.report_config_id) AND (p.user_id = (SELECT auth.uid()))))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: roles (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and developers can manage roles" ON roles;
CREATE POLICY "Admins and developers can manage roles"
  ON roles FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: rsvp_scan_events (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view all RSVP scan events" ON rsvp_scan_events;
CREATE POLICY "Admins can view all RSVP scan events"
  ON rsvp_scan_events FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Event managers can view their event RSVP scan events" ON rsvp_scan_events;
CREATE POLICY "Event managers can view their event RSVP scan events"
  ON rsvp_scan_events FOR SELECT
  USING (
    is_event_manager((SELECT auth.uid()), event_id)
  );

DROP POLICY IF EXISTS "Staff with scan permission can view RSVP scan events" ON rsvp_scan_events;
CREATE POLICY "Staff with scan permission can view RSVP scan events"
  ON rsvp_scan_events FOR SELECT
  USING (
    has_permission((SELECT auth.uid()), 'scan_tickets'::text)
  );

-- ----------------------------------------------------------------------------
-- TABLE: scavenger_claims (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admin access to scavenger_claims" ON scavenger_claims;
CREATE POLICY "Admin access to scavenger_claims"
  ON scavenger_claims FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: scavenger_locations (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admin access to scavenger_locations" ON scavenger_locations;
CREATE POLICY "Admin access to scavenger_locations"
  ON scavenger_locations FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: scavenger_tokens (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admin access to scavenger_tokens" ON scavenger_tokens;
CREATE POLICY "Admin access to scavenger_tokens"
  ON scavenger_tokens FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: screening_config (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can update config" ON screening_config;
CREATE POLICY "Admins can update config"
  ON screening_config FOR UPDATE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: screening_reviews (5 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete reviews" ON screening_reviews;
CREATE POLICY "Admins can delete reviews"
  ON screening_reviews FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Reviewers can update own reviews" ON screening_reviews;
CREATE POLICY "Reviewers can update own reviews"
  ON screening_reviews FOR UPDATE
  USING (
    (reviewer_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Reviewers can view others' reviews after submitting" ON screening_reviews;
CREATE POLICY "Reviewers can view others' reviews after submitting"
  ON screening_reviews FOR SELECT
  USING (
    (submission_id IN ( SELECT screening_reviews_1.submission_id
   FROM screening_reviews screening_reviews_1
  WHERE (screening_reviews_1.reviewer_id = (SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Reviewers can view own reviews" ON screening_reviews;
CREATE POLICY "Reviewers can view own reviews"
  ON screening_reviews FOR SELECT
  USING (
    (reviewer_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Staff can view all reviews" ON screening_reviews;
CREATE POLICY "Staff can view all reviews"
  ON screening_reviews FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'fm_staff'::text) OR has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: screening_submissions (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete submissions" ON screening_submissions;
CREATE POLICY "Admins can delete submissions"
  ON screening_submissions FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Artists can view own submissions" ON screening_submissions;
CREATE POLICY "Artists can view own submissions"
  ON screening_submissions FOR SELECT
  USING (
    (artist_id IN ( SELECT a.id
   FROM artists a
  WHERE (a.user_id = (SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Staff can update submissions" ON screening_submissions;
CREATE POLICY "Staff can update submissions"
  ON screening_submissions FOR UPDATE
  USING (
    (has_role((SELECT auth.uid()), 'fm_staff'::text) OR has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Staff can view all submissions" ON screening_submissions;
CREATE POLICY "Staff can view all submissions"
  ON screening_submissions FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'fm_staff'::text) OR has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: submission_tags (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Staff can remove submission tags" ON submission_tags;
CREATE POLICY "Staff can remove submission tags"
  ON submission_tags FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'fm_staff'::text) OR has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: table_metadata (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Only admins can modify table metadata" ON table_metadata;
CREATE POLICY "Only admins can modify table metadata"
  ON table_metadata FOR ALL
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: tags (5 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and FM staff can delete tags" ON tags;
CREATE POLICY "Admins and FM staff can delete tags"
  ON tags FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'fm_staff'::text) OR has_role((SELECT auth.uid()), 'developer'::text))
  );

DROP POLICY IF EXISTS "Admins and FM staff can update tags" ON tags;
CREATE POLICY "Admins and FM staff can update tags"
  ON tags FOR UPDATE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'fm_staff'::text) OR has_role((SELECT auth.uid()), 'developer'::text))
  );

DROP POLICY IF EXISTS "Admins can delete tags" ON tags;
CREATE POLICY "Admins can delete tags"
  ON tags FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Creators and admins can update tags" ON tags;
CREATE POLICY "Creators and admins can update tags"
  ON tags FOR UPDATE
  USING (
    ((created_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Users can view tags they created" ON tags;
CREATE POLICY "Users can view tags they created"
  ON tags FOR SELECT
  USING (
    ((created_by = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'fm_staff'::text) OR has_role((SELECT auth.uid()), 'developer'::text))
  );

-- ----------------------------------------------------------------------------
-- TABLE: test_event_interests (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage test interests" ON test_event_interests;
CREATE POLICY "Admins can manage test interests"
  ON test_event_interests FOR ALL
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  )
  WITH CHECK (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: test_event_rsvps (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage test RSVPs" ON test_event_rsvps;
CREATE POLICY "Admins can manage test RSVPs"
  ON test_event_rsvps FOR ALL
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  )
  WITH CHECK (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: test_order_items (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage test order items" ON test_order_items;
CREATE POLICY "Admins can manage test order items"
  ON test_order_items FOR ALL
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  )
  WITH CHECK (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: test_orders (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage test orders" ON test_orders;
CREATE POLICY "Admins can manage test orders"
  ON test_orders FOR ALL
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  )
  WITH CHECK (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: test_profiles (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage test profiles" ON test_profiles;
CREATE POLICY "Admins can manage test profiles"
  ON test_profiles FOR ALL
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  )
  WITH CHECK (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: test_tickets (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage test tickets" ON test_tickets;
CREATE POLICY "Admins can manage test tickets"
  ON test_tickets FOR ALL
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  )
  WITH CHECK (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: ticket_groups (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and devs can delete ticket groups" ON ticket_groups;
CREATE POLICY "Admins and devs can delete ticket groups"
  ON ticket_groups FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins and devs can update ticket groups" ON ticket_groups;
CREATE POLICY "Admins and devs can update ticket groups"
  ON ticket_groups FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Org members with manage_events can delete ticket groups" ON ticket_groups;
CREATE POLICY "Org members with manage_events can delete ticket groups"
  ON ticket_groups FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((e.id = ticket_groups.event_id) AND (p.user_id = (SELECT auth.uid()))))))
  );

DROP POLICY IF EXISTS "Org members with manage_events can update ticket groups" ON ticket_groups;
CREATE POLICY "Org members with manage_events can update ticket groups"
  ON ticket_groups FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((e.id = ticket_groups.event_id) AND (p.user_id = (SELECT auth.uid()))))))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((e.id = ticket_groups.event_id) AND (p.user_id = (SELECT auth.uid()))))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: ticket_holds (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete holds" ON ticket_holds;
CREATE POLICY "Admins can delete holds"
  ON ticket_holds FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update holds" ON ticket_holds;
CREATE POLICY "Admins can update holds"
  ON ticket_holds FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Users can view their own holds" ON ticket_holds;
CREATE POLICY "Users can view their own holds"
  ON ticket_holds FOR SELECT
  USING (
    ((user_id = (SELECT auth.uid())) OR (user_id IS NULL))
  );

-- ----------------------------------------------------------------------------
-- TABLE: ticket_scan_events (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Staff and organizers can view scan events" ON ticket_scan_events;
CREATE POLICY "Staff and organizers can view scan events"
  ON ticket_scan_events FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR has_permission((SELECT auth.uid()), 'scan_tickets'::text) OR (EXISTS ( SELECT 1
   FROM (events e
     JOIN organizations o ON ((o.id = e.organization_id)))
  WHERE ((e.id = ticket_scan_events.event_id) AND (o.owner_id = (SELECT auth.uid()))))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: ticket_tiers (7 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and devs can delete ticket tiers" ON ticket_tiers;
CREATE POLICY "Admins and devs can delete ticket tiers"
  ON ticket_tiers FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins and devs can update ticket tiers" ON ticket_tiers;
CREATE POLICY "Admins and devs can update ticket tiers"
  ON ticket_tiers FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can delete ticket tiers" ON ticket_tiers;
CREATE POLICY "Admins can delete ticket tiers"
  ON ticket_tiers FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update ticket tiers" ON ticket_tiers;
CREATE POLICY "Admins can update ticket tiers"
  ON ticket_tiers FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can view all ticket tiers" ON ticket_tiers;
CREATE POLICY "Admins can view all ticket tiers"
  ON ticket_tiers FOR SELECT
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Org members with manage_events can delete ticket tiers" ON ticket_tiers;
CREATE POLICY "Org members with manage_events can delete ticket tiers"
  ON ticket_tiers FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((e.id = ticket_tiers.event_id) AND (p.user_id = (SELECT auth.uid()))))))
  );

DROP POLICY IF EXISTS "Org members with manage_events can update ticket tiers" ON ticket_tiers;
CREATE POLICY "Org members with manage_events can update ticket tiers"
  ON ticket_tiers FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((e.id = ticket_tiers.event_id) AND (p.user_id = (SELECT auth.uid()))))))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((e.id = ticket_tiers.event_id) AND (p.user_id = (SELECT auth.uid()))))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: ticketing_fees (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete fees" ON ticketing_fees;
CREATE POLICY "Admins can delete fees"
  ON ticketing_fees FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update fees" ON ticketing_fees;
CREATE POLICY "Admins can update fees"
  ON ticketing_fees FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Public can view active ticketing fees" ON ticketing_fees;
CREATE POLICY "Public can view active ticketing fees"
  ON ticketing_fees FOR SELECT
  USING (
    ((is_active = true) OR (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: ticketing_sessions (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Only admins can view ticketing sessions directly" ON ticketing_sessions;
CREATE POLICY "Only admins can view ticketing sessions directly"
  ON ticketing_sessions FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text))
  );

-- ----------------------------------------------------------------------------
-- TABLE: tickets (5 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete tickets" ON tickets;
CREATE POLICY "Admins can delete tickets"
  ON tickets FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update tickets" ON tickets;
CREATE POLICY "Admins can update tickets"
  ON tickets FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Users can update attendee info for their tickets" ON tickets;
CREATE POLICY "Users can update attendee info for their tickets"
  ON tickets FOR UPDATE
  USING (
    (order_id IN ( SELECT orders.id
   FROM orders
  WHERE (orders.user_id = (SELECT auth.uid()))))
  )
  WITH CHECK (
    (order_id IN ( SELECT orders.id
   FROM orders
  WHERE (orders.user_id = (SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Users can view tickets for their orders" ON tickets;
CREATE POLICY "Users can view tickets for their orders"
  ON tickets FOR SELECT
  USING (
    (order_id IN ( SELECT orders.id
   FROM orders
  WHERE (orders.user_id = (SELECT auth.uid()))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: tracking_links (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and devs can manage tracking links" ON tracking_links;
CREATE POLICY "Admins and devs can manage tracking links"
  ON tracking_links FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Org members with manage_events can manage tracking links" ON tracking_links;
CREATE POLICY "Org members with manage_events can manage tracking links"
  ON tracking_links FOR ALL
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND has_permission((SELECT auth.uid()), 'manage_events'::text) AND (EXISTS ( SELECT 1
   FROM (events e
     JOIN profiles p ON ((p.organization_id = e.organization_id)))
  WHERE ((e.id = tracking_links.event_id) AND (p.user_id = (SELECT auth.uid()))))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: undercard_requests (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and devs can delete undercard requests" ON undercard_requests;
CREATE POLICY "Admins and devs can delete undercard requests"
  ON undercard_requests FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins and devs can update undercard requests" ON undercard_requests;
CREATE POLICY "Admins and devs can update undercard requests"
  ON undercard_requests FOR UPDATE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins and devs can view all undercard requests" ON undercard_requests;
CREATE POLICY "Admins and devs can view all undercard requests"
  ON undercard_requests FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR has_role((SELECT auth.uid()), 'developer'::text) OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Users can view their own undercard requests" ON undercard_requests;
CREATE POLICY "Users can view their own undercard requests"
  ON undercard_requests FOR SELECT
  USING (
    (EXISTS ( SELECT 1
   FROM artist_registrations ar
  WHERE ((ar.id = undercard_requests.artist_registration_id) AND (ar.user_id = (SELECT auth.uid())))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: user_event_interests (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can delete own interests" ON user_event_interests;
CREATE POLICY "Users can delete own interests"
  ON user_event_interests FOR DELETE
  USING (
    ((SELECT auth.uid()) = user_id)
  );

-- ----------------------------------------------------------------------------
-- TABLE: user_ignored_submissions (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can unignore their submissions" ON user_ignored_submissions;
CREATE POLICY "Users can unignore their submissions"
  ON user_ignored_submissions FOR DELETE
  USING (
    (user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can view their own ignored submissions" ON user_ignored_submissions;
CREATE POLICY "Users can view their own ignored submissions"
  ON user_ignored_submissions FOR SELECT
  USING (
    (user_id = (SELECT auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- TABLE: user_requests (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "user_requests_delete_policy" ON user_requests;
CREATE POLICY "user_requests_delete_policy"
  ON user_requests FOR DELETE
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text])))))
  );

DROP POLICY IF EXISTS "user_requests_select_policy" ON user_requests;
CREATE POLICY "user_requests_select_policy"
  ON user_requests FOR SELECT
  USING (
    (((SELECT auth.uid()) = user_id) OR (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text, 'org_admin'::text]))))))
  );

DROP POLICY IF EXISTS "user_requests_update_policy" ON user_requests;
CREATE POLICY "user_requests_update_policy"
  ON user_requests FOR UPDATE
  USING (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text, 'org_admin'::text])))))
  )
  WITH CHECK (
    (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN roles r ON ((ur.role_id = r.id)))
  WHERE ((ur.user_id = (SELECT auth.uid())) AND (r.name = ANY (ARRAY['admin'::text, 'developer'::text, 'org_admin'::text])))))
  );

-- ----------------------------------------------------------------------------
-- TABLE: user_roles (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete user_roles" ON user_roles;
CREATE POLICY "Admins can delete user_roles"
  ON user_roles FOR DELETE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text))
  );

DROP POLICY IF EXISTS "Admins can update user_roles" ON user_roles;
CREATE POLICY "Admins can update user_roles"
  ON user_roles FOR UPDATE
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text))
  );

DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text))
  );

DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (
    ((SELECT auth.uid()) = user_id)
  );

-- ----------------------------------------------------------------------------
-- TABLE: venue_required_genres (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage venue genres" ON venue_required_genres;
CREATE POLICY "Admins can manage venue genres"
  ON venue_required_genres FOR ALL
  USING (
    (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: venues (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete venues" ON venues;
CREATE POLICY "Admins can delete venues"
  ON venues FOR DELETE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

DROP POLICY IF EXISTS "Admins can update venues" ON venues;
CREATE POLICY "Admins can update venues"
  ON venues FOR UPDATE
  USING (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  )
  WITH CHECK (
    (((SELECT auth.uid()) IS NOT NULL) AND (has_role((SELECT auth.uid()), 'admin'::text) OR is_dev_admin((SELECT auth.uid()))))
  );

-- ============================================================================
-- End of Phase 8 Migration
-- ============================================================================
--
-- Verification: Run this query to confirm no unoptimized policies remain
--
-- SELECT COUNT(*) as remaining_unoptimized
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (
--     qual LIKE '%auth.uid()%'
--     OR qual LIKE '%has_role(auth.uid()%'
--     OR qual LIKE '%is_dev_admin(auth.uid()%'
--     OR qual LIKE '%has_permission(auth.uid()%'
--   )
--   AND (
--     qual NOT LIKE '%(SELECT auth.uid())%'
--     AND COALESCE(with_check, '') NOT LIKE '%(SELECT auth.uid())%'
--   );
--
-- Expected result: 0
-- ============================================================================

