-- Add fee inheritance flags for hierarchical fee configuration
-- This enables: Event -> Group -> Tier fee inheritance chain

-- events table: add event-level fee settings
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS use_default_fees boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS fee_flat_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_pct_bps integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN events.use_default_fees IS 'When true, uses global ticketing_fees; when false, uses fee_flat_cents/fee_pct_bps';
COMMENT ON COLUMN events.fee_flat_cents IS 'Custom flat fee in cents (only used when use_default_fees is false)';
COMMENT ON COLUMN events.fee_pct_bps IS 'Custom percentage fee in basis points (only used when use_default_fees is false)';

-- ticket_groups: add inheritance flag (fee_flat_cents and fee_pct_bps already exist)
ALTER TABLE ticket_groups
  ADD COLUMN IF NOT EXISTS inherit_event_fees boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN ticket_groups.inherit_event_fees IS 'When true, inherits from event; when false, uses fee_flat_cents/fee_pct_bps';

-- ticket_tiers: add inheritance flag (fee_flat_cents and fee_pct_bps already exist)
ALTER TABLE ticket_tiers
  ADD COLUMN IF NOT EXISTS inherit_group_fees boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN ticket_tiers.inherit_group_fees IS 'When true, inherits from group; when false, uses fee_flat_cents/fee_pct_bps';
