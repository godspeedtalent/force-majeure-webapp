-- ============================================
-- GUESTS TABLE - For unauthenticated users
-- ============================================
-- This table stores guest information for users who haven't created accounts.
-- Guests can later be linked to a profile when they sign up.

-- 1. Create table
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact information
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,

  -- Billing address (same structure as profiles/orders)
  billing_address_line_1 TEXT,
  billing_address_line_2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_zip_code TEXT,
  billing_country TEXT DEFAULT 'US',

  -- Optional link to profile (set when guest creates an account)
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Stripe customer ID for repeat purchases
  stripe_customer_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints (same as profiles where applicable)
  CONSTRAINT guest_full_name_length CHECK (char_length(full_name) <= 100),
  CONSTRAINT guest_billing_state_format CHECK (billing_state IS NULL OR billing_state ~ '^[A-Z]{2}$'),
  CONSTRAINT guest_billing_zip_code_format CHECK (billing_zip_code IS NULL OR billing_zip_code ~ '^\d{5}(-\d{4})?$'),
  CONSTRAINT guest_billing_country_format CHECK (billing_country IS NULL OR length(billing_country) = 2)
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
CREATE INDEX IF NOT EXISTS idx_guests_profile_id ON guests(profile_id);
CREATE INDEX IF NOT EXISTS idx_guests_stripe_customer_id ON guests(stripe_customer_id);

-- 3. Create updated_at trigger
DROP TRIGGER IF EXISTS update_guests_updated_at ON guests;
CREATE TRIGGER update_guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable RLS
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- 5. Grant permissions
-- Authenticated users need full access to manage guests during import
GRANT SELECT, INSERT, UPDATE, DELETE ON guests TO authenticated;
-- Anonymous users may need to create guests during checkout
GRANT SELECT, INSERT ON guests TO anon;

-- 6. RLS Policies

-- Admins/developers can do everything
CREATE POLICY "Admins can manage all guests"
  ON guests FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Users can view guests that are linked to their profile
CREATE POLICY "Users can view own guest records"
  ON guests FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Anonymous users can create new guest records
CREATE POLICY "Anyone can create guests"
  ON guests FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anonymous users can view guests by exact email match (for checkout flow)
-- This is handled through service role on the backend, not direct anon access

-- 7. Add comments
COMMENT ON TABLE guests IS 'Stores guest information for unauthenticated users. Can be linked to profiles when guest creates an account.';
COMMENT ON COLUMN guests.email IS 'Guest email address (required)';
COMMENT ON COLUMN guests.full_name IS 'Guest full name';
COMMENT ON COLUMN guests.phone IS 'Guest phone number';
COMMENT ON COLUMN guests.profile_id IS 'Reference to profile if guest later creates an account';
COMMENT ON COLUMN guests.stripe_customer_id IS 'Stripe customer ID for repeat purchases';

-- ============================================
-- MODIFY ORDERS TABLE - Add optional guest_id
-- ============================================
-- Allow orders to reference either a user_id OR a guest_id

-- Add guest_id column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES guests(id) ON DELETE SET NULL;

-- Make user_id nullable (orders can now have either user_id or guest_id)
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint to ensure at least one of user_id or guest_id is set
ALTER TABLE orders DROP CONSTRAINT IF EXISTS order_has_user_or_guest;
ALTER TABLE orders ADD CONSTRAINT order_has_user_or_guest
  CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL);

-- Add index for guest orders
CREATE INDEX IF NOT EXISTS idx_orders_guest_id ON orders(guest_id);

-- Add comment
COMMENT ON COLUMN orders.guest_id IS 'Reference to guest record for unauthenticated purchases';

-- ============================================
-- FUNCTION: Link guest to profile
-- ============================================
-- When a guest creates an account, this function links their guest records
-- to their new profile

CREATE OR REPLACE FUNCTION link_guest_to_profile(
  p_guest_email TEXT,
  p_profile_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update guests with matching email to reference the profile
  UPDATE guests
  SET
    profile_id = p_profile_id,
    updated_at = NOW()
  WHERE
    email = LOWER(p_guest_email)
    AND profile_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Also update any orders from this guest to reference the new user
  UPDATE orders
  SET
    user_id = p_profile_id,
    updated_at = NOW()
  WHERE
    guest_id IN (SELECT id FROM guests WHERE email = LOWER(p_guest_email))
    AND user_id IS NULL;

  RETURN updated_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION link_guest_to_profile(TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION link_guest_to_profile IS 'Links guest records to a profile when guest creates an account. Returns number of guest records updated.';
