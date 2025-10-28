-- Add dev admin access to ALL tables for complete control in dev environment

-- ============================================================
-- API LOGS
-- ============================================================
DROP POLICY IF EXISTS "Only admins can insert logs" ON public.api_logs;
DROP POLICY IF EXISTS "Only admins can view logs" ON public.api_logs;

CREATE POLICY "Admins can insert logs"
ON public.api_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can view logs"
ON public.api_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can update logs"
ON public.api_logs
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete logs"
ON public.api_logs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- ARTISTS
-- ============================================================
CREATE POLICY "Admins can insert artists"
ON public.artists
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can update artists"
ON public.artists
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete artists"
ON public.artists
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- EVENT ARTISTS
-- ============================================================
CREATE POLICY "Admins can insert event_artists"
ON public.event_artists
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can update event_artists"
ON public.event_artists
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete event_artists"
ON public.event_artists
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- EXCLUSIVE CONTENT GRANTS (for testing)
-- ============================================================
CREATE POLICY "Admins can insert content grants"
ON public.exclusive_content_grants
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can update content grants"
ON public.exclusive_content_grants
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete content grants"
ON public.exclusive_content_grants
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- FEATURE FLAGS
-- ============================================================
DROP POLICY IF EXISTS "Only admins can insert feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Only admins can delete feature flags" ON public.feature_flags;

CREATE POLICY "Admins can insert feature flags"
ON public.feature_flags
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete feature flags"
ON public.feature_flags
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- MERCH
-- ============================================================
CREATE POLICY "Admins can insert merch"
ON public.merch
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can update merch"
ON public.merch
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete merch"
ON public.merch
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- ORDER ITEMS (for testing)
-- ============================================================
CREATE POLICY "Admins can insert order_items"
ON public.order_items
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can update order_items"
ON public.order_items
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete order_items"
ON public.order_items
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- ORDERS (for testing)
-- ============================================================
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- PROFILES (for testing)
-- ============================================================
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- SCAVENGER CLAIMS
-- ============================================================
DROP POLICY IF EXISTS "Only admins can delete claims" ON public.scavenger_claims;

CREATE POLICY "Admins can delete claims"
ON public.scavenger_claims
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can update claims"
ON public.scavenger_claims
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- SCAVENGER LOCATIONS
-- ============================================================
CREATE POLICY "Admins can insert locations"
ON public.scavenger_locations
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can update locations"
ON public.scavenger_locations
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete locations"
ON public.scavenger_locations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- SCAVENGER TOKENS (for testing)
-- ============================================================
CREATE POLICY "Admins can insert tokens"
ON public.scavenger_tokens
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can update tokens"
ON public.scavenger_tokens
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete tokens"
ON public.scavenger_tokens
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- SONGS
-- ============================================================
CREATE POLICY "Admins can insert songs"
ON public.songs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can update songs"
ON public.songs
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete songs"
ON public.songs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- TICKET HOLDS
-- ============================================================
CREATE POLICY "Admins can update holds"
ON public.ticket_holds
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete holds"
ON public.ticket_holds
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- TICKETING FEES
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage fees" ON public.ticketing_fees;

CREATE POLICY "Admins can insert fees"
ON public.ticketing_fees
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can update fees"
ON public.ticketing_fees
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete fees"
ON public.ticketing_fees
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- TICKETS (for testing)
-- ============================================================
CREATE POLICY "Admins can insert tickets"
ON public.tickets
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete tickets"
ON public.tickets
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- USER ROLES
-- ============================================================
CREATE POLICY "Admins can update user_roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete user_roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

-- ============================================================
-- WEBHOOK EVENTS (for testing)
-- ============================================================
CREATE POLICY "Admins can insert webhook_events"
ON public.webhook_events
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can update webhook_events"
ON public.webhook_events
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());

CREATE POLICY "Admins can delete webhook_events"
ON public.webhook_events
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR is_dev_admin());