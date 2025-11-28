-- Migration: Add products table and improve order_items schema
-- Purpose: Support non-ticket items (protection, merchandise, etc.) as line items
-- Industry-standard e-commerce schema where order_items = receipt line items

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
-- Store non-ticket products: ticket protection, merchandise, parking, etc.
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('ticket_protection', 'merchandise', 'parking', 'vip_upgrade', 'service_fee', 'other')),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (is_active = true);

-- Only admins can manage products
CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ============================================================================
-- MODIFY ORDER_ITEMS TABLE
-- ============================================================================
-- Add item_type to distinguish tickets from products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'order_items'
    AND column_name = 'item_type'
  ) THEN
    ALTER TABLE order_items
    ADD COLUMN item_type TEXT NOT NULL DEFAULT 'ticket' CHECK (item_type IN ('ticket', 'product'));
  END IF;
END $$;

-- Add product_id for non-ticket items (nullable - only used when item_type='product')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'order_items'
    AND column_name = 'product_id'
  ) THEN
    ALTER TABLE order_items
    ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Make ticket_tier_id nullable (only required when item_type='ticket')
ALTER TABLE order_items
  ALTER COLUMN ticket_tier_id DROP NOT NULL;

-- Add constraint: ticket items must have ticket_tier_id, product items must have product_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'order_items_item_type_reference_check'
  ) THEN
    ALTER TABLE order_items
    ADD CONSTRAINT order_items_item_type_reference_check
    CHECK (
      (item_type = 'ticket' AND ticket_tier_id IS NOT NULL AND product_id IS NULL) OR
      (item_type = 'product' AND product_id IS NOT NULL AND ticket_tier_id IS NULL)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item_type ON order_items(item_type);

COMMENT ON COLUMN order_items.item_type IS 'Type of line item: ticket (from ticket_tier) or product (from products table)';
COMMENT ON COLUMN order_items.product_id IS 'Reference to products table (only when item_type=product)';
COMMENT ON COLUMN order_items.ticket_tier_id IS 'Reference to ticket_tiers table (only when item_type=ticket)';

-- ============================================================================
-- MODIFY TICKETS TABLE
-- ============================================================================
-- Add has_protection boolean to track which tickets have protection
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tickets'
    AND column_name = 'has_protection'
  ) THEN
    ALTER TABLE tickets
    ADD COLUMN has_protection BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tickets_has_protection ON tickets(has_protection);

COMMENT ON COLUMN tickets.has_protection IS 'Whether this ticket has ticket protection coverage (derived from order_items)';

-- ============================================================================
-- SEED DEFAULT TICKET PROTECTION PRODUCT
-- ============================================================================
-- Insert default ticket protection product (idempotent)
INSERT INTO products (id, name, description, type, price_cents, is_active, metadata)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Ticket Protection',
  'Protect your ticket investment. Get a full refund if you can''t attend for any covered reason.',
  'ticket_protection',
  500, -- $5.00 per ticket
  true,
  '{"coverage": ["illness", "emergency", "schedule_conflict"], "refund_deadline_hours": 24}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- UPDATE TIMESTAMP TRIGGER FOR PRODUCTS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at_trigger ON products;
CREATE TRIGGER update_products_updated_at_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT ON TABLE public.products TO authenticated;
GRANT SELECT ON TABLE public.products TO anon;
