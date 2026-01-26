-- ============================================================================
-- RLS Policy Optimization - Phase 3: Supporting Tables (High Volume)
-- ============================================================================
--
-- Optimizes RLS policies by wrapping auth.uid(), has_role(), and is_dev_admin()
-- calls with (SELECT ...) to enable index usage and prevent sequential scans.
--
-- Tables in this phase:
-- - venues (4 policies)
-- - artists (4 policies)
-- - genres (1 policy)
-- - artist_genres (1 policy)
-- - event_artists (1 policy)
-- - ticket_tiers (5 policies)
-- - tickets (5 policies)
-- - order_items (5 policies)
-- - ticketing_fees (4 policies)
-- - promo_codes (4 policies)
-- - event_images (4 policies)
-- - queue_configurations (4 policies)
-- - roles (1 policy)
-- - feature_flags (4 policies)
-- - ticket_holds (4 policies)
--
-- Total: 51 policies
--
-- Performance Impact:
-- Sequential scan: O(n) - scans entire table
-- Index scan: O(log n) - uses B-tree indexes
-- Expected improvement: 10-100x faster on user-specific queries
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: venues (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert venues" ON venues;
CREATE POLICY "Admins can insert venues"
  ON venues FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update venues" ON venues;
CREATE POLICY "Admins can update venues"
  ON venues FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete venues" ON venues;
CREATE POLICY "Admins can delete venues"
  ON venues FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: artists (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert artists" ON artists;
CREATE POLICY "Admins can insert artists"
  ON artists FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update artists" ON artists;
CREATE POLICY "Admins can update artists"
  ON artists FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete artists" ON artists;
CREATE POLICY "Admins can delete artists"
  ON artists FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: genres (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and developers can manage genres" ON genres;
CREATE POLICY "Admins and developers can manage genres"
  ON genres FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR has_role((SELECT auth.uid()), 'developer'))
  );

-- ----------------------------------------------------------------------------
-- TABLE: artist_genres (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and developers can manage artist genres" ON artist_genres;
CREATE POLICY "Admins and developers can manage artist genres"
  ON artist_genres FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR has_role((SELECT auth.uid()), 'developer'))
  );

-- ----------------------------------------------------------------------------
-- TABLE: event_artists (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can manage event artists" ON event_artists;
CREATE POLICY "Admins can manage event artists"
  ON event_artists FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: ticket_tiers (5 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can view all ticket tiers" ON ticket_tiers;
CREATE POLICY "Admins can view all ticket tiers"
  ON ticket_tiers FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can insert ticket tiers" ON ticket_tiers;
CREATE POLICY "Admins can insert ticket tiers"
  ON ticket_tiers FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update ticket tiers" ON ticket_tiers;
CREATE POLICY "Admins can update ticket tiers"
  ON ticket_tiers FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete ticket tiers" ON ticket_tiers;
CREATE POLICY "Admins can delete ticket tiers"
  ON ticket_tiers FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: tickets (5 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view tickets for their orders" ON tickets;
CREATE POLICY "Users can view tickets for their orders"
  ON tickets FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can update attendee info for their tickets" ON tickets;
CREATE POLICY "Users can update attendee info for their tickets"
  ON tickets FOR UPDATE
  USING (order_id IN (SELECT id FROM orders WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can insert tickets" ON tickets;
CREATE POLICY "Admins can insert tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete tickets" ON tickets;
CREATE POLICY "Admins can delete tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: order_items (5 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view items for their orders" ON order_items;
CREATE POLICY "Users can view items for their orders"
  ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can insert items for their orders" ON order_items;
CREATE POLICY "Users can insert items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update order_items" ON order_items;
CREATE POLICY "Admins can update order_items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete order_items" ON order_items;
CREATE POLICY "Admins can delete order_items"
  ON order_items FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: ticketing_fees (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert fees" ON ticketing_fees;
CREATE POLICY "Admins can insert fees"
  ON ticketing_fees FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update fees" ON ticketing_fees;
CREATE POLICY "Admins can update fees"
  ON ticketing_fees FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete fees" ON ticketing_fees;
CREATE POLICY "Admins can delete fees"
  ON ticketing_fees FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: promo_codes (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert promo codes" ON promo_codes;
CREATE POLICY "Admins can insert promo codes"
  ON promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update promo codes" ON promo_codes;
CREATE POLICY "Admins can update promo codes"
  ON promo_codes FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete promo codes" ON promo_codes;
CREATE POLICY "Admins can delete promo codes"
  ON promo_codes FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: event_images (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and developers can insert event images" ON event_images;
CREATE POLICY "Admins and developers can insert event images"
  ON event_images FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (
      has_role((SELECT auth.uid()), 'admin')
      OR has_role((SELECT auth.uid()), 'developer')
    )
  );

DROP POLICY IF EXISTS "Admins and developers can update event images" ON event_images;
CREATE POLICY "Admins and developers can update event images"
  ON event_images FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (
      has_role((SELECT auth.uid()), 'admin')
      OR has_role((SELECT auth.uid()), 'developer')
    )
  );

DROP POLICY IF EXISTS "Admins and developers can delete event images" ON event_images;
CREATE POLICY "Admins and developers can delete event images"
  ON event_images FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (
      has_role((SELECT auth.uid()), 'admin')
      OR has_role((SELECT auth.uid()), 'developer')
    )
  );

-- ----------------------------------------------------------------------------
-- TABLE: queue_configurations (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can create queue configurations" ON queue_configurations;
CREATE POLICY "Admins can create queue configurations"
  ON queue_configurations FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    has_role((SELECT auth.uid()), 'admin')
  );

DROP POLICY IF EXISTS "Admins can update queue configurations" ON queue_configurations;
CREATE POLICY "Admins can update queue configurations"
  ON queue_configurations FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    has_role((SELECT auth.uid()), 'admin')
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    has_role((SELECT auth.uid()), 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete queue configurations" ON queue_configurations;
CREATE POLICY "Admins can delete queue configurations"
  ON queue_configurations FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    has_role((SELECT auth.uid()), 'admin')
  );

-- ----------------------------------------------------------------------------
-- TABLE: roles (1 policy)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins and developers can manage roles" ON roles;
CREATE POLICY "Admins and developers can manage roles"
  ON roles FOR ALL
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (
      has_role((SELECT auth.uid()), 'admin')
      OR has_role((SELECT auth.uid()), 'developer')
      OR is_dev_admin((SELECT auth.uid()))
    )
  );

-- ----------------------------------------------------------------------------
-- TABLE: feature_flags (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can insert feature flags" ON feature_flags;
CREATE POLICY "Admins can insert feature flags"
  ON feature_flags FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update feature flags" ON feature_flags;
CREATE POLICY "Admins can update feature flags"
  ON feature_flags FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete feature flags" ON feature_flags;
CREATE POLICY "Admins can delete feature flags"
  ON feature_flags FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: ticket_holds (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own holds" ON ticket_holds;
CREATE POLICY "Users can view their own holds"
  ON ticket_holds FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can create holds" ON ticket_holds;
CREATE POLICY "Users can create holds"
  ON ticket_holds FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()) OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins can update holds" ON ticket_holds;
CREATE POLICY "Admins can update holds"
  ON ticket_holds FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete holds" ON ticket_holds;
CREATE POLICY "Admins can delete holds"
  ON ticket_holds FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ============================================================================
-- End of Phase 3 Migration
-- ============================================================================
--
-- Verification queries to run after migration:
--
-- Check index usage on high-volume tables:
-- SELECT * FROM pg_stat_user_indexes
-- WHERE tablename IN ('venues', 'artists', 'tickets', 'order_items', 'ticket_tiers');
--
-- Verify policy changes:
-- SELECT policyname, tablename FROM pg_policies
-- WHERE tablename IN ('venues', 'artists', 'genres', 'artist_genres', 'event_artists',
--                     'ticket_tiers', 'tickets', 'order_items', 'ticketing_fees',
--                     'promo_codes', 'event_images', 'queue_configurations',
--                     'roles', 'feature_flags', 'ticket_holds')
-- ORDER BY tablename, policyname;
--
-- Test query performance:
-- EXPLAIN ANALYZE SELECT * FROM tickets WHERE order_id IN
--   (SELECT id FROM orders WHERE user_id = '<your_user_id>');
-- EXPLAIN ANALYZE SELECT * FROM ticket_tiers WHERE event_id = '<event_id>';
-- ============================================================================
