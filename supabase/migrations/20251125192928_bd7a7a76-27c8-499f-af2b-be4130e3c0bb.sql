-- Add fee_breakdown JSONB column to orders and order_items tables
ALTER TABLE orders 
ADD COLUMN fee_breakdown jsonb DEFAULT '{}'::jsonb;

ALTER TABLE order_items 
ADD COLUMN fee_breakdown jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN orders.fee_breakdown IS 'Breakdown of fees: {platform_fee_cents: 250, processing_fee_cents: 150, ...}';
COMMENT ON COLUMN order_items.fee_breakdown IS 'Breakdown of fees: {platform_fee_cents: 50, processing_fee_cents: 30, ...}';