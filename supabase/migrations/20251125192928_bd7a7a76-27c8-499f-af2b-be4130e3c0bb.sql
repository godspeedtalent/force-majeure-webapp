-- Add fee_breakdown JSONB column to orders and order_items tables (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name = 'fee_breakdown'
  ) THEN
    ALTER TABLE orders
    ADD COLUMN fee_breakdown jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'order_items'
    AND column_name = 'fee_breakdown'
  ) THEN
    ALTER TABLE order_items
    ADD COLUMN fee_breakdown jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

COMMENT ON COLUMN orders.fee_breakdown IS 'Breakdown of fees: {platform_fee_cents: 250, processing_fee_cents: 150, ...}';
COMMENT ON COLUMN order_items.fee_breakdown IS 'Breakdown of fees: {platform_fee_cents: 50, processing_fee_cents: 30, ...}';