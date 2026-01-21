-- Add variable fee items system
-- Allows multiple labeled fees at each level (event, group, tier)
-- Groups/tiers can inherit parent fees AND add additional ones

-- Add label column to ticketing_fees for global fee labels
ALTER TABLE ticketing_fees
  ADD COLUMN IF NOT EXISTS label TEXT;

-- Update existing fees with default labels based on fee_name
UPDATE ticketing_fees SET label =
  CASE fee_name
    WHEN 'sales_tax' THEN 'Sales Tax'
    WHEN 'processing_fee' THEN 'Processing Fee'
    WHEN 'platform_fee' THEN 'Platform Fee'
    ELSE INITCAP(REPLACE(fee_name, '_', ' '))
  END
WHERE label IS NULL;

-- Add sort_order to ticketing_fees
ALTER TABLE ticketing_fees
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Create entity_fee_items table for storing additional fees at each level
CREATE TABLE IF NOT EXISTS entity_fee_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Entity type: 'event', 'group', or 'tier'
  entity_type TEXT NOT NULL CHECK (entity_type IN ('event', 'group', 'tier')),
  -- Reference to the entity (event_id, group_id, or tier_id)
  entity_id UUID NOT NULL,
  -- User-friendly label for this fee
  label TEXT NOT NULL,
  -- Type of fee: flat (in cents) or percentage (in basis points)
  fee_type TEXT NOT NULL CHECK (fee_type IN ('flat', 'percentage')),
  -- Fee value: cents for flat, basis points (hundredths of percent) for percentage
  fee_value INTEGER NOT NULL CHECK (fee_value >= 0),
  -- Order in which fees are displayed/calculated
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- Whether this fee is currently active
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_entity_fee_items_entity
  ON entity_fee_items(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_fee_items_active
  ON entity_fee_items(entity_type, entity_id) WHERE is_active = true;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_entity_fee_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_entity_fee_items_updated_at ON entity_fee_items;
CREATE TRIGGER update_entity_fee_items_updated_at
  BEFORE UPDATE ON entity_fee_items
  FOR EACH ROW
  EXECUTE FUNCTION update_entity_fee_items_updated_at();

-- RLS policies for entity_fee_items
ALTER TABLE entity_fee_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read fee items
CREATE POLICY "entity_fee_items_select_policy" ON entity_fee_items
  FOR SELECT USING (true);

-- Allow org admins and staff to manage fee items
CREATE POLICY "entity_fee_items_insert_policy" ON entity_fee_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'org_admin')
    )
  );

CREATE POLICY "entity_fee_items_update_policy" ON entity_fee_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'org_admin')
    )
  );

CREATE POLICY "entity_fee_items_delete_policy" ON entity_fee_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'org_admin')
    )
  );

-- Grant permissions
GRANT SELECT ON entity_fee_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON entity_fee_items TO authenticated;

-- Add comment
COMMENT ON TABLE entity_fee_items IS 'Stores additional fee items for events, ticket groups, and ticket tiers. Supports hierarchical inheritance where entities can add fees on top of inherited ones.';
