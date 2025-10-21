-- ============================================================================
-- MIGRATION 1: Core Commerce Tables & Ticket System Refactor
-- ============================================================================

-- 1. REFACTOR ticket_tiers table
ALTER TABLE ticket_tiers
  -- Change price to cents (preserve existing data)
  ADD COLUMN price_cents INTEGER,
  
  -- Add inventory tracking
  ADD COLUMN available_inventory INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN reserved_inventory INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN sold_inventory INTEGER NOT NULL DEFAULT 0,
  
  -- Add fee structure
  ADD COLUMN fee_flat_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN fee_pct_bps INTEGER NOT NULL DEFAULT 0;

-- Migrate existing price data (NUMERIC -> INTEGER cents)
UPDATE ticket_tiers SET price_cents = (price * 100)::INTEGER;

-- Make price_cents NOT NULL after data migration
ALTER TABLE ticket_tiers ALTER COLUMN price_cents SET NOT NULL;

-- Initialize inventory from existing data
UPDATE ticket_tiers SET 
  available_inventory = total_tickets - COALESCE(tickets_sold, 0),
  sold_inventory = COALESCE(tickets_sold, 0);

-- Drop old columns after migration
ALTER TABLE ticket_tiers 
  DROP COLUMN price,
  DROP COLUMN tickets_sold;

-- Add inventory constraint (validation trigger for future compatibility)
CREATE OR REPLACE FUNCTION validate_ticket_tier_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.available_inventory + NEW.reserved_inventory + NEW.sold_inventory != NEW.total_tickets THEN
    RAISE EXCEPTION 'Inventory sum (% + % + %) must equal total_tickets (%)', 
      NEW.available_inventory, NEW.reserved_inventory, NEW.sold_inventory, NEW.total_tickets;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_ticket_tier_inventory
  BEFORE INSERT OR UPDATE ON ticket_tiers
  FOR EACH ROW
  EXECUTE FUNCTION validate_ticket_tier_inventory();

-- Add non-negative inventory constraints
ALTER TABLE ticket_tiers
  ADD CONSTRAINT available_inventory_non_negative CHECK (available_inventory >= 0),
  ADD CONSTRAINT reserved_inventory_non_negative CHECK (reserved_inventory >= 0),
  ADD CONSTRAINT sold_inventory_non_negative CHECK (sold_inventory >= 0);

-- 2. CREATE ticket_holds table
CREATE TABLE ticket_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_tier_id UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ticket_holds_expiry ON ticket_holds(expires_at);
CREATE INDEX idx_ticket_holds_tier ON ticket_holds(ticket_tier_id);

-- 3. CREATE orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Pricing
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  fees_cents INTEGER NOT NULL DEFAULT 0 CHECK (fees_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  
  -- Stripe integration
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'paid', 'refunded', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add validation trigger for total calculation
CREATE OR REPLACE FUNCTION validate_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_cents != NEW.subtotal_cents + NEW.fees_cents THEN
    RAISE EXCEPTION 'total_cents (%) must equal subtotal_cents (%) + fees_cents (%)', 
      NEW.total_cents, NEW.subtotal_cents, NEW.fees_cents;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_order_totals
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_totals();

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_event ON orders(event_id);
CREATE INDEX idx_orders_stripe_session ON orders(stripe_checkout_session_id);

-- 4. CREATE order_items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_tier_id UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE RESTRICT,
  
  -- Snapshot pricing (immutable record of what was charged)
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  unit_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_fee_cents >= 0),
  
  -- Computed totals
  subtotal_cents INTEGER GENERATED ALWAYS AS (quantity * unit_price_cents) STORED,
  fees_cents INTEGER GENERATED ALWAYS AS (quantity * unit_fee_cents) STORED,
  total_cents INTEGER GENERATED ALWAYS AS (quantity * (unit_price_cents + unit_fee_cents)) STORED,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_tier ON order_items(ticket_tier_id);

-- 5. CREATE tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  ticket_tier_id UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE RESTRICT,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Ticket holder info (optional, can be different from order user)
  attendee_name TEXT,
  attendee_email TEXT,
  
  -- Security
  qr_code_data TEXT UNIQUE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'valid' 
    CHECK (status IN ('valid', 'used', 'refunded', 'cancelled')),
  
  -- Check-in tracking
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT,
  
  -- Wallet pass URLs (stub for Phase 2)
  apple_wallet_url TEXT,
  google_wallet_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_order ON tickets(order_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_qr ON tickets(qr_code_data);
CREATE INDEX idx_tickets_status ON tickets(status);

-- 6. CREATE exclusive_content_grants table (stub)
CREATE TABLE exclusive_content_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Content access
  content_type TEXT NOT NULL CHECK (content_type IN ('spotify_playlist', 'video', 'photo_gallery', 'download')),
  content_url TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  
  -- Tracking
  accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, event_id, content_type)
);

CREATE INDEX idx_content_grants_user ON exclusive_content_grants(user_id);
CREATE INDEX idx_content_grants_event ON exclusive_content_grants(event_id);

-- 7. CREATE webhook_events table (idempotency)
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL
);

CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed_at);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- ticket_holds RLS
ALTER TABLE ticket_holds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own holds"
  ON ticket_holds FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create holds"
  ON ticket_holds FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- orders RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- order_items RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items for their orders"
  ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

-- tickets RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tickets for their orders"
  ON tickets FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "Users can update attendee info for their tickets"
  ON tickets FOR UPDATE
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()))
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

-- exclusive_content_grants RLS
ALTER TABLE exclusive_content_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own content grants"
  ON exclusive_content_grants FOR SELECT
  USING (user_id = auth.uid());

-- webhook_events - no RLS, only edge functions access
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to webhooks"
  ON webhook_events FOR SELECT
  USING (false);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Create a ticket hold
CREATE OR REPLACE FUNCTION create_ticket_hold(
  p_ticket_tier_id UUID,
  p_quantity INTEGER,
  p_user_id UUID,
  p_fingerprint TEXT,
  p_hold_duration_seconds INTEGER DEFAULT 540
)
RETURNS TABLE(hold_id UUID, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_available INTEGER;
BEGIN
  v_expires_at := now() + (p_hold_duration_seconds || ' seconds')::INTERVAL;
  
  SELECT available_inventory INTO v_available
  FROM ticket_tiers
  WHERE id = p_ticket_tier_id
  FOR UPDATE;
  
  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient tickets available. Requested: %, Available: %', p_quantity, v_available;
  END IF;
  
  UPDATE ticket_tiers
  SET 
    available_inventory = available_inventory - p_quantity,
    reserved_inventory = reserved_inventory + p_quantity
  WHERE id = p_ticket_tier_id;
  
  INSERT INTO ticket_holds (
    ticket_tier_id,
    quantity,
    user_id,
    fingerprint,
    expires_at
  ) VALUES (
    p_ticket_tier_id,
    p_quantity,
    p_user_id,
    p_fingerprint,
    v_expires_at
  )
  RETURNING id INTO v_hold_id;
  
  RETURN QUERY SELECT v_hold_id, v_expires_at;
END;
$$;

-- Function: Release a ticket hold
CREATE OR REPLACE FUNCTION release_ticket_hold(p_hold_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier_id UUID;
  v_quantity INTEGER;
BEGIN
  DELETE FROM ticket_holds
  WHERE id = p_hold_id
  RETURNING ticket_tier_id, quantity INTO v_tier_id, v_quantity;
  
  IF FOUND THEN
    UPDATE ticket_tiers
    SET 
      available_inventory = available_inventory + v_quantity,
      reserved_inventory = reserved_inventory - v_quantity
    WHERE id = v_tier_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Function: Convert hold to sale (called when payment succeeds)
CREATE OR REPLACE FUNCTION convert_hold_to_sale(p_hold_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier_id UUID;
  v_quantity INTEGER;
BEGIN
  DELETE FROM ticket_holds
  WHERE id = p_hold_id
  RETURNING ticket_tier_id, quantity INTO v_tier_id, v_quantity;
  
  IF FOUND THEN
    UPDATE ticket_tiers
    SET 
      reserved_inventory = reserved_inventory - v_quantity,
      sold_inventory = sold_inventory + v_quantity
    WHERE id = v_tier_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at on orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update updated_at on tickets
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();