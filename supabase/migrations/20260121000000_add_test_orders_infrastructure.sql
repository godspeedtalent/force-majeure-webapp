-- ============================================
-- Test Orders Infrastructure Migration
-- ============================================
-- Creates dedicated test tables for mock order data generation.
-- These tables mirror the production orders/order_items/tickets structure
-- but use test_profile_id instead of user_id (no FK to auth.users).
-- ============================================

-- ============================================
-- 1. Create test_orders table
-- ============================================
CREATE TABLE IF NOT EXISTS test_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  test_profile_id UUID REFERENCES test_profiles(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  customer_email TEXT,
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  fees_cents INTEGER NOT NULL DEFAULT 0 CHECK (fees_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  fee_breakdown JSONB,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- At least one of test_profile_id or guest_id must be set
  CONSTRAINT test_order_has_owner CHECK (test_profile_id IS NOT NULL OR guest_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_test_orders_event_id ON test_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_test_orders_test_profile_id ON test_orders(test_profile_id);
CREATE INDEX IF NOT EXISTS idx_test_orders_guest_id ON test_orders(guest_id);
CREATE INDEX IF NOT EXISTS idx_test_orders_status ON test_orders(status);
CREATE INDEX IF NOT EXISTS idx_test_orders_created_at ON test_orders(created_at DESC);

COMMENT ON TABLE test_orders IS 'Test orders for mock data generation. Links to test_profiles instead of auth.users.';

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_test_orders_updated_at ON test_orders;
CREATE TRIGGER update_test_orders_updated_at
  BEFORE UPDATE ON test_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. Create test_order_items table
-- ============================================
CREATE TABLE IF NOT EXISTS test_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_order_id UUID NOT NULL REFERENCES test_orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'ticket' CHECK (item_type IN ('ticket', 'product')),
  ticket_tier_id UUID REFERENCES ticket_tiers(id) ON DELETE RESTRICT,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  unit_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_fee_cents >= 0),
  subtotal_cents INTEGER GENERATED ALWAYS AS (quantity * unit_price_cents) STORED,
  fees_cents INTEGER GENERATED ALWAYS AS (quantity * unit_fee_cents) STORED,
  total_cents INTEGER GENERATED ALWAYS AS (quantity * (unit_price_cents + unit_fee_cents)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraint: ticket items must have ticket_tier_id, product items must have product_id
  CONSTRAINT test_order_items_item_type_reference_check CHECK (
    (item_type = 'ticket' AND ticket_tier_id IS NOT NULL AND product_id IS NULL) OR
    (item_type = 'product' AND product_id IS NOT NULL AND ticket_tier_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_test_order_items_test_order_id ON test_order_items(test_order_id);
CREATE INDEX IF NOT EXISTS idx_test_order_items_ticket_tier_id ON test_order_items(ticket_tier_id);
CREATE INDEX IF NOT EXISTS idx_test_order_items_product_id ON test_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_test_order_items_item_type ON test_order_items(item_type);

COMMENT ON TABLE test_order_items IS 'Test order line items for mock data generation.';

-- ============================================
-- 3. Create test_tickets table
-- ============================================
CREATE TABLE IF NOT EXISTS test_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_order_id UUID NOT NULL REFERENCES test_orders(id) ON DELETE CASCADE,
  test_order_item_id UUID NOT NULL REFERENCES test_order_items(id) ON DELETE CASCADE,
  ticket_tier_id UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE RESTRICT,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  attendee_name TEXT,
  attendee_email TEXT,
  qr_code_data TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'refunded', 'cancelled')),
  has_protection BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_tickets_test_order_id ON test_tickets(test_order_id);
CREATE INDEX IF NOT EXISTS idx_test_tickets_event_id ON test_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_test_tickets_qr_code ON test_tickets(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_test_tickets_status ON test_tickets(status);
CREATE INDEX IF NOT EXISTS idx_test_tickets_ticket_tier_id ON test_tickets(ticket_tier_id);

COMMENT ON TABLE test_tickets IS 'Test tickets for mock data generation.';

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_test_tickets_updated_at ON test_tickets;
CREATE TRIGGER update_test_tickets_updated_at
  BEFORE UPDATE ON test_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Enable RLS and policies for all test tables
-- ============================================

-- test_orders RLS
ALTER TABLE test_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage test orders"
  ON test_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON test_orders TO authenticated;

-- test_order_items RLS
ALTER TABLE test_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage test order items"
  ON test_order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON test_order_items TO authenticated;

-- test_tickets RLS
ALTER TABLE test_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage test tickets"
  ON test_tickets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON test_tickets TO authenticated;

-- ============================================
-- 5. Update delete_mock_orders_by_event function
-- ============================================
-- Drop existing function first (return type is changing)
DROP FUNCTION IF EXISTS delete_mock_orders_by_event(UUID);

CREATE FUNCTION delete_mock_orders_by_event(p_event_id UUID)
RETURNS TABLE (
  deleted_tickets INTEGER,
  deleted_order_items INTEGER,
  deleted_orders INTEGER,
  deleted_guests INTEGER,
  deleted_rsvps INTEGER,
  deleted_interests INTEGER,
  deleted_test_profiles INTEGER,
  deleted_test_tickets INTEGER,
  deleted_test_order_items INTEGER,
  deleted_test_orders INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_tickets INTEGER := 0;
  v_deleted_order_items INTEGER := 0;
  v_deleted_orders INTEGER := 0;
  v_deleted_guests INTEGER := 0;
  v_deleted_rsvps INTEGER := 0;
  v_deleted_interests INTEGER := 0;
  v_deleted_test_profiles INTEGER := 0;
  v_deleted_test_tickets INTEGER := 0;
  v_deleted_test_order_items INTEGER := 0;
  v_deleted_test_orders INTEGER := 0;
  v_order_ids UUID[];
  v_guest_ids UUID[];
  v_test_order_ids UUID[];
  v_test_profile_ids UUID[];
BEGIN
  -- =============================================
  -- PHASE 1: Delete from new test_* tables
  -- =============================================

  -- Get all test order IDs for this event
  SELECT ARRAY_AGG(id) INTO v_test_order_ids
  FROM test_orders
  WHERE event_id = p_event_id;

  -- Delete test tickets
  IF v_test_order_ids IS NOT NULL AND array_length(v_test_order_ids, 1) > 0 THEN
    DELETE FROM test_tickets WHERE test_order_id = ANY(v_test_order_ids);
    GET DIAGNOSTICS v_deleted_test_tickets = ROW_COUNT;

    -- Delete test order items
    DELETE FROM test_order_items WHERE test_order_id = ANY(v_test_order_ids);
    GET DIAGNOSTICS v_deleted_test_order_items = ROW_COUNT;

    -- Delete test orders
    DELETE FROM test_orders WHERE id = ANY(v_test_order_ids);
    GET DIAGNOSTICS v_deleted_test_orders = ROW_COUNT;
  END IF;

  -- =============================================
  -- PHASE 2: Delete test RSVPs and interests
  -- =============================================

  -- Get test profile IDs associated with this event (from RSVPs and interests)
  SELECT ARRAY_AGG(DISTINCT tp.id) INTO v_test_profile_ids
  FROM test_profiles tp
  WHERE EXISTS (
    SELECT 1 FROM test_event_rsvps ter WHERE ter.test_profile_id = tp.id AND ter.event_id = p_event_id
  ) OR EXISTS (
    SELECT 1 FROM test_event_interests tei WHERE tei.test_profile_id = tp.id AND tei.event_id = p_event_id
  ) OR EXISTS (
    SELECT 1 FROM test_orders tor WHERE tor.test_profile_id = tp.id AND tor.event_id = p_event_id
  );

  -- Delete test RSVPs for this event
  DELETE FROM test_event_rsvps WHERE event_id = p_event_id;
  GET DIAGNOSTICS v_deleted_rsvps = ROW_COUNT;

  -- Delete test interests for this event
  DELETE FROM test_event_interests WHERE event_id = p_event_id;
  GET DIAGNOSTICS v_deleted_interests = ROW_COUNT;

  -- Delete orphaned test profiles (not used by any other event)
  IF v_test_profile_ids IS NOT NULL AND array_length(v_test_profile_ids, 1) > 0 THEN
    DELETE FROM test_profiles tp
    WHERE tp.id = ANY(v_test_profile_ids)
      AND NOT EXISTS (SELECT 1 FROM test_event_rsvps ter WHERE ter.test_profile_id = tp.id)
      AND NOT EXISTS (SELECT 1 FROM test_event_interests tei WHERE tei.test_profile_id = tp.id)
      AND NOT EXISTS (SELECT 1 FROM test_orders tor WHERE tor.test_profile_id = tp.id);
    GET DIAGNOSTICS v_deleted_test_profiles = ROW_COUNT;
  END IF;

  -- =============================================
  -- PHASE 3: Legacy cleanup - Delete from production tables
  -- (For backward compatibility with any existing test data)
  -- =============================================

  -- Get all mock order IDs from production orders table
  SELECT ARRAY_AGG(id) INTO v_order_ids
  FROM orders
  WHERE event_id = p_event_id AND test_data = true;

  -- Get guest IDs that were created for these orders (only orphaned guests)
  IF v_order_ids IS NOT NULL AND array_length(v_order_ids, 1) > 0 THEN
    SELECT ARRAY_AGG(DISTINCT o.guest_id) INTO v_guest_ids
    FROM orders o
    WHERE o.id = ANY(v_order_ids)
      AND o.guest_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM orders o2
        WHERE o2.guest_id = o.guest_id
          AND o2.id != o.id
          AND o2.test_data = false
      );
  END IF;

  -- If no legacy mock orders, skip production table cleanup
  IF v_order_ids IS NULL OR array_length(v_order_ids, 1) IS NULL THEN
    RETURN QUERY SELECT
      0, 0, 0, 0,
      v_deleted_rsvps, v_deleted_interests, v_deleted_test_profiles,
      v_deleted_test_tickets, v_deleted_test_order_items, v_deleted_test_orders;
    RETURN;
  END IF;

  -- Delete tickets from production table
  DELETE FROM tickets WHERE order_id = ANY(v_order_ids);
  GET DIAGNOSTICS v_deleted_tickets = ROW_COUNT;

  -- Delete order items from production table
  DELETE FROM order_items WHERE order_id = ANY(v_order_ids);
  GET DIAGNOSTICS v_deleted_order_items = ROW_COUNT;

  -- Delete orders from production table
  DELETE FROM orders WHERE id = ANY(v_order_ids);
  GET DIAGNOSTICS v_deleted_orders = ROW_COUNT;

  -- Delete orphaned guests
  IF v_guest_ids IS NOT NULL AND array_length(v_guest_ids, 1) > 0 THEN
    DELETE FROM guests WHERE id = ANY(v_guest_ids);
    GET DIAGNOSTICS v_deleted_guests = ROW_COUNT;
  END IF;

  RETURN QUERY SELECT
    v_deleted_tickets, v_deleted_order_items, v_deleted_orders, v_deleted_guests,
    v_deleted_rsvps, v_deleted_interests, v_deleted_test_profiles,
    v_deleted_test_tickets, v_deleted_test_order_items, v_deleted_test_orders;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_mock_orders_by_event(UUID) TO authenticated;

COMMENT ON FUNCTION delete_mock_orders_by_event IS 'Atomically deletes all mock/test data for an event including test_orders, test_tickets, RSVPs, interests, and legacy production test data.';
