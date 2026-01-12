-- ============================================
-- ADDRESSES TABLE - Normalized address storage
-- ============================================
--
-- This migration creates a normalized addresses table that allows
-- profiles, guests, and organizations to have multiple addresses.
-- Orders retain denormalized address fields for historical accuracy.
--

-- 1. Create address_type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'address_type') THEN
    CREATE TYPE address_type AS ENUM ('billing', 'shipping', 'headquarters', 'other');
  END IF;
END $$;

-- 2. Create addresses table
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Address fields (standardized)
  line_1 TEXT,
  line_2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',

  -- Metadata
  address_type address_type NOT NULL DEFAULT 'billing',
  label TEXT, -- Optional custom label like "Home", "Office"
  is_default BOOLEAN DEFAULT false,

  -- Polymorphic ownership (only one should be set)
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT address_state_format CHECK (state IS NULL OR state ~ '^[A-Z]{2}$'),
  CONSTRAINT address_zip_code_format CHECK (zip_code IS NULL OR zip_code ~ '^\d{5}(-\d{4})?$'),
  CONSTRAINT address_country_format CHECK (country IS NULL OR length(country) = 2),
  CONSTRAINT address_single_owner CHECK (
    (CASE WHEN profile_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN guest_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN organization_id IS NOT NULL THEN 1 ELSE 0 END) = 1
  )
);

-- 3. Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_addresses_profile_id ON addresses(profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_addresses_guest_id ON addresses(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_addresses_organization_id ON addresses(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_addresses_type ON addresses(address_type);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(is_default) WHERE is_default = true;

-- 4. Create updated_at trigger
DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- 6. Grant permissions (CRITICAL: Both GRANTs AND RLS required per RLS_AND_GRANTS_GUIDE.md)
GRANT SELECT, INSERT, UPDATE, DELETE ON addresses TO authenticated;
GRANT SELECT ON addresses TO anon;

-- 7. RLS Policies

-- Users can manage their own profile addresses
CREATE POLICY "Users can manage own profile addresses"
  ON addresses FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Users can view addresses linked to their guest records (when guest converts to user)
CREATE POLICY "Users can view linked guest addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (
    guest_id IN (
      SELECT id FROM guests WHERE profile_id = auth.uid()
    )
  );

-- Org members can view org addresses
CREATE POLICY "Org members can view org addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Org owners can manage org addresses
CREATE POLICY "Org owners can manage org addresses"
  ON addresses FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Admins and developers can manage all addresses
CREATE POLICY "Admins can manage all addresses"
  ON addresses FOR ALL
  TO authenticated
  USING (
    is_dev_admin(auth.uid())
  )
  WITH CHECK (
    is_dev_admin(auth.uid())
  );

-- 8. Add comments for documentation
COMMENT ON TABLE addresses IS 'Normalized address storage for profiles, guests, and organizations. Orders keep denormalized addresses for historical accuracy.';
COMMENT ON COLUMN addresses.address_type IS 'Type of address: billing, shipping, headquarters, other';
COMMENT ON COLUMN addresses.label IS 'Optional custom label like Home, Office, etc.';
COMMENT ON COLUMN addresses.is_default IS 'Whether this is the default address for its type and owner';
COMMENT ON COLUMN addresses.profile_id IS 'Owning user profile (mutually exclusive with guest_id, organization_id)';
COMMENT ON COLUMN addresses.guest_id IS 'Owning guest record (mutually exclusive with profile_id, organization_id)';
COMMENT ON COLUMN addresses.organization_id IS 'Owning organization (mutually exclusive with profile_id, guest_id)';
