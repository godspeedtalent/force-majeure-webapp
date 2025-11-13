-- Migration: Fix all RLS policies to handle anonymous users (auth.uid() = NULL)
-- Created: 2025-11-11
-- Description: Add NULL checks to all policies that use has_role() or is_dev_admin()
--              to prevent failures when anonymous users access public data

-- ============================================================================
-- Profiles - Admin policies (SELECT ones need fixing)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- ============================================================================
-- Roles - Split FOR ALL policy into separate policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins and developers can manage roles" ON roles;

CREATE POLICY "Admins and developers can insert roles"
  ON roles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

CREATE POLICY "Admins and developers can update roles"
  ON roles FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

CREATE POLICY "Admins and developers can delete roles"
  ON roles FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

-- ============================================================================
-- User Roles
-- ============================================================================

DROP POLICY IF EXISTS "Admins and developers can view all roles" ON user_roles;
CREATE POLICY "Admins and developers can view all roles"
  ON user_roles FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

DROP POLICY IF EXISTS "Admins and developers can insert user_roles" ON user_roles;
CREATE POLICY "Admins and developers can insert user_roles"
  ON user_roles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

DROP POLICY IF EXISTS "Admins and developers can update user_roles" ON user_roles;
CREATE POLICY "Admins and developers can update user_roles"
  ON user_roles FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

DROP POLICY IF EXISTS "Admins and developers can delete user_roles" ON user_roles;
CREATE POLICY "Admins and developers can delete user_roles"
  ON user_roles FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

-- ============================================================================
-- Feature Flags
-- ============================================================================

DROP POLICY IF EXISTS "Admins can insert feature flags" ON feature_flags;
CREATE POLICY "Admins can insert feature flags"
  ON feature_flags FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can update feature flags" ON feature_flags;
CREATE POLICY "Admins can update feature flags"
  ON feature_flags FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can delete feature flags" ON feature_flags;
CREATE POLICY "Admins can delete feature flags"
  ON feature_flags FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- ============================================================================
-- Genres - Split FOR ALL policy
-- ============================================================================

DROP POLICY IF EXISTS "Admins and developers can manage genres" ON genres;

CREATE POLICY "Admins and developers can insert genres"
  ON genres FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

CREATE POLICY "Admins and developers can update genres"
  ON genres FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

CREATE POLICY "Admins and developers can delete genres"
  ON genres FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

-- ============================================================================
-- Artist Genres - Split FOR ALL policy
-- ============================================================================

DROP POLICY IF EXISTS "Admins and developers can manage artist genres" ON artist_genres;

CREATE POLICY "Admins and developers can insert artist genres"
  ON artist_genres FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

CREATE POLICY "Admins and developers can update artist genres"
  ON artist_genres FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

CREATE POLICY "Admins and developers can delete artist genres"
  ON artist_genres FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

-- ============================================================================
-- Event Artists - Split FOR ALL policy
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage event artists" ON event_artists;

CREATE POLICY "Admins can insert event artists"
  ON event_artists FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

CREATE POLICY "Admins can update event artists"
  ON event_artists FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

CREATE POLICY "Admins can delete event artists"
  ON event_artists FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- ============================================================================
-- All other admin INSERT/UPDATE/DELETE policies
-- ============================================================================

-- Cities
DROP POLICY IF EXISTS "Admins can insert cities" ON cities;
CREATE POLICY "Admins can insert cities"
  ON cities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can update cities" ON cities;
CREATE POLICY "Admins can update cities"
  ON cities FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()))
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can delete cities" ON cities;
CREATE POLICY "Admins can delete cities"
  ON cities FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- Venues
DROP POLICY IF EXISTS "Admins can insert venues" ON venues;
CREATE POLICY "Admins can insert venues"
  ON venues FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can update venues" ON venues;
CREATE POLICY "Admins can update venues"
  ON venues FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()))
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can delete venues" ON venues;
CREATE POLICY "Admins can delete venues"
  ON venues FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- Events
DROP POLICY IF EXISTS "Admins can insert events" ON events;
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can update events" ON events;
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()))
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can delete events" ON events;
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- Artists
DROP POLICY IF EXISTS "Admins can insert artists" ON artists;
CREATE POLICY "Admins can insert artists"
  ON artists FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can update artists" ON artists;
CREATE POLICY "Admins can update artists"
  ON artists FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can delete artists" ON artists;
CREATE POLICY "Admins can delete artists"
  ON artists FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- Ticket Tiers
DROP POLICY IF EXISTS "Admins can insert ticket tiers" ON ticket_tiers;
CREATE POLICY "Admins can insert ticket tiers"
  ON ticket_tiers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can update ticket tiers" ON ticket_tiers;
CREATE POLICY "Admins can update ticket tiers"
  ON ticket_tiers FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()))
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can delete ticket tiers" ON ticket_tiers;
CREATE POLICY "Admins can delete ticket tiers"
  ON ticket_tiers FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- Holds
DROP POLICY IF EXISTS "Admins can update holds" ON ticket_holds;
CREATE POLICY "Admins can update holds"
  ON ticket_holds FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can delete holds" ON ticket_holds;
CREATE POLICY "Admins can delete holds"
  ON ticket_holds FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- Orders
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- Order Items
DROP POLICY IF EXISTS "Admins can update order_items" ON order_items;
CREATE POLICY "Admins can update order_items"
  ON order_items FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can delete order_items" ON order_items;
CREATE POLICY "Admins can delete order_items"
  ON order_items FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- Tickets
DROP POLICY IF EXISTS "Admins can insert tickets" ON tickets;
CREATE POLICY "Admins can insert tickets"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can delete tickets" ON tickets;
CREATE POLICY "Admins can delete tickets"
  ON tickets FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- Ticketing Fees
DROP POLICY IF EXISTS "Admins can insert fees" ON ticketing_fees;
CREATE POLICY "Admins can insert fees"
  ON ticketing_fees FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can update fees" ON ticketing_fees;
CREATE POLICY "Admins can update fees"
  ON ticketing_fees FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can delete fees" ON ticketing_fees;
CREATE POLICY "Admins can delete fees"
  ON ticketing_fees FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- Promo Codes
DROP POLICY IF EXISTS "Admins can insert promo codes" ON promo_codes;
CREATE POLICY "Admins can insert promo codes"
  ON promo_codes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can update promo codes" ON promo_codes;
CREATE POLICY "Admins can update promo codes"
  ON promo_codes FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can delete promo codes" ON promo_codes;
CREATE POLICY "Admins can delete promo codes"
  ON promo_codes FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- Queue Configuration
DROP POLICY IF EXISTS "Admins can update queue configurations" ON queue_configurations;
CREATE POLICY "Admins can update queue configurations"
  ON queue_configurations FOR UPDATE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()))
  WITH CHECK (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

DROP POLICY IF EXISTS "Admins can delete queue configurations" ON queue_configurations;
CREATE POLICY "Admins can delete queue configurations"
  ON queue_configurations FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- Event Views
DROP POLICY IF EXISTS "Only admins can delete event views" ON event_views;
CREATE POLICY "Only admins can delete event views"
  ON event_views FOR DELETE
  USING (auth.uid() IS NOT NULL AND (has_role(auth.uid(), 'admin') OR is_dev_admin()));

-- Event Images
DROP POLICY IF EXISTS "Admins and developers can insert event images" ON event_images;
CREATE POLICY "Admins and developers can insert event images"
  ON event_images FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

DROP POLICY IF EXISTS "Admins and developers can update event images" ON event_images;
CREATE POLICY "Admins and developers can update event images"
  ON event_images FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );

DROP POLICY IF EXISTS "Admins and developers can delete event images" ON event_images;
CREATE POLICY "Admins and developers can delete event images"
  ON event_images FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin()
    )
  );
