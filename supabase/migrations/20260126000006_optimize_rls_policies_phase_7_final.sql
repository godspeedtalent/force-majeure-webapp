-- ============================================================================
-- RLS Policy Optimization - Phase 7: Final Cleanup
-- ============================================================================
--
-- Optimizes ALL remaining RLS policies with unoptimized auth function calls.
-- This phase covers tables that were modified or created in mid-to-late January.
--
-- Tables in this phase:
-- - profiles (2 policies)
-- - event_rsvps (4 policies)
-- - comp_tickets (2 policies)
-- - promo_code_groups (1 policy)
-- - promo_code_tiers (1 policy)
-- - entity_fee_items (3 policies)
-- - queue_configurations (2 policies)
-- - pending_order_links (1 policy)
--
-- Total: 16 policies
--
-- Performance Impact:
-- Sequential scan: O(n) - scans entire table
-- Index scan: O(log n) - uses B-tree indexes
-- Expected improvement: 10-100x faster on user-specific queries
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: profiles (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- TABLE: event_rsvps (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can insert own RSVP" ON event_rsvps;
CREATE POLICY "Users can insert own RSVP"
  ON event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own RSVP" ON event_rsvps;
CREATE POLICY "Users can update own RSVP"
  ON event_rsvps FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own RSVP" ON event_rsvps;
CREATE POLICY "Users can delete own RSVP"
  ON event_rsvps FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage all RSVPs" ON event_rsvps;
CREATE POLICY "Admins can manage all RSVPs"
  ON event_rsvps FOR ALL
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- TABLE: comp_tickets (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage all comp tickets" ON comp_tickets;
CREATE POLICY "Admins can manage all comp tickets"
  ON comp_tickets FOR ALL
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can view own comp tickets" ON comp_tickets;
CREATE POLICY "Users can view own comp tickets"
  ON comp_tickets FOR SELECT
  TO authenticated
  USING (
    recipient_user_id = (SELECT auth.uid()) OR
    recipient_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- TABLE: promo_code_groups (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage promo code groups" ON promo_code_groups;
CREATE POLICY "Admins can manage promo code groups"
  ON promo_code_groups FOR ALL
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- TABLE: promo_code_tiers (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage promo code tiers" ON promo_code_tiers;
CREATE POLICY "Admins can manage promo code tiers"
  ON promo_code_tiers FOR ALL
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- TABLE: entity_fee_items (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "entity_fee_items_insert_policy" ON entity_fee_items;
CREATE POLICY "entity_fee_items_insert_policy"
  ON entity_fee_items FOR INSERT
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'org_admin')
  );

DROP POLICY IF EXISTS "entity_fee_items_update_policy" ON entity_fee_items;
CREATE POLICY "entity_fee_items_update_policy"
  ON entity_fee_items FOR UPDATE
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'org_admin')
  );

DROP POLICY IF EXISTS "entity_fee_items_delete_policy" ON entity_fee_items;
CREATE POLICY "entity_fee_items_delete_policy"
  ON entity_fee_items FOR DELETE
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'org_admin')
  );

-- ----------------------------------------------------------------------------
-- TABLE: queue_configurations (2 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage queue configurations" ON queue_configurations;
CREATE POLICY "Admins can manage queue configurations"
  ON queue_configurations FOR ALL
  TO authenticated
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  )
  WITH CHECK (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer') OR
    is_dev_admin((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Event managers can manage queue configurations" ON queue_configurations;
CREATE POLICY "Event managers can manage queue configurations"
  ON queue_configurations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = queue_configurations.event_id
      AND (
        EXISTS (
          SELECT 1 FROM organizations o
          WHERE o.id = e.organization_id
          AND o.owner_id = (SELECT auth.uid())
        )
        OR
        EXISTS (
          SELECT 1 FROM event_staff es
          WHERE es.event_id = e.id
          AND es.user_id = (SELECT auth.uid())
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
          AND o.owner_id = (SELECT auth.uid())
        )
        OR
        EXISTS (
          SELECT 1 FROM event_staff es
          WHERE es.event_id = e.id
          AND es.user_id = (SELECT auth.uid())
          AND es.role IN ('manager', 'admin')
        )
      )
    )
  );

-- ----------------------------------------------------------------------------
-- TABLE: pending_order_links (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view pending order links" ON pending_order_links;
CREATE POLICY "Admins can view pending order links"
  ON pending_order_links FOR SELECT
  USING (
    has_role((SELECT auth.uid()), 'admin') OR
    has_role((SELECT auth.uid()), 'developer')
  );

-- ============================================================================
-- End of Phase 7 Migration
-- ============================================================================
--
-- Verification queries to run after migration:
--
-- Verify policy changes:
-- SELECT tablename, COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE tablename IN ('profiles', 'event_rsvps', 'comp_tickets',
--                     'promo_code_groups', 'promo_code_tiers', 'entity_fee_items',
--                     'queue_configurations', 'pending_order_links')
-- GROUP BY tablename
-- ORDER BY tablename;
--
-- ============================================================================
-- CRITICAL: Run the discovery query to find ANY remaining unoptimized policies
-- ============================================================================
--
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) as using_clause
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (
--     pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%auth.uid()%'
--     OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%auth.jwt()%'
--     OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%has_role(auth%'
--     OR pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) LIKE '%is_dev_admin(auth%'
--   )
--   AND pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) NOT LIKE '%(SELECT auth.uid())%'
--   AND pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) NOT LIKE '%(SELECT auth.jwt())%'
-- ORDER BY tablename, policyname;
--
-- This query will show ALL policies that still call auth functions per-row instead of per-query.
-- ============================================================================
