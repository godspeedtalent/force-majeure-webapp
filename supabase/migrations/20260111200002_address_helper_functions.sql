-- ============================================
-- ADDRESS HELPER FUNCTIONS
-- ============================================
--
-- Database functions for common address operations.
--

-- Get default billing address for a profile
CREATE OR REPLACE FUNCTION get_profile_billing_address(p_profile_id UUID)
RETURNS TABLE (
  id UUID,
  line_1 TEXT,
  line_2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.line_1,
    a.line_2,
    a.city,
    a.state,
    a.zip_code,
    a.country
  FROM addresses a
  WHERE a.profile_id = p_profile_id
    AND a.address_type = 'billing'
    AND a.is_default = true
  LIMIT 1;
END;
$$;

-- Get default billing address for a guest
CREATE OR REPLACE FUNCTION get_guest_billing_address(p_guest_id UUID)
RETURNS TABLE (
  id UUID,
  line_1 TEXT,
  line_2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.line_1,
    a.line_2,
    a.city,
    a.state,
    a.zip_code,
    a.country
  FROM addresses a
  WHERE a.guest_id = p_guest_id
    AND a.address_type = 'billing'
    AND a.is_default = true
  LIMIT 1;
END;
$$;

-- Get all addresses for a profile
CREATE OR REPLACE FUNCTION get_profile_addresses(p_profile_id UUID)
RETURNS SETOF addresses
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM addresses
  WHERE profile_id = p_profile_id
  ORDER BY is_default DESC, created_at DESC;
END;
$$;

-- Upsert profile billing address (creates or updates default billing)
CREATE OR REPLACE FUNCTION upsert_profile_billing_address(
  p_profile_id UUID,
  p_line_1 TEXT DEFAULT NULL,
  p_line_2 TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_zip_code TEXT DEFAULT NULL,
  p_country TEXT DEFAULT 'US'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_address_id UUID;
BEGIN
  -- Try to update existing default billing address
  UPDATE addresses
  SET
    line_1 = p_line_1,
    line_2 = p_line_2,
    city = p_city,
    state = p_state,
    zip_code = p_zip_code,
    country = p_country,
    updated_at = NOW()
  WHERE profile_id = p_profile_id
    AND address_type = 'billing'
    AND is_default = true
  RETURNING id INTO v_address_id;

  -- If no existing address, create one
  IF v_address_id IS NULL THEN
    INSERT INTO addresses (
      profile_id, line_1, line_2, city, state, zip_code, country,
      address_type, is_default
    )
    VALUES (
      p_profile_id, p_line_1, p_line_2, p_city, p_state, p_zip_code, p_country,
      'billing', true
    )
    RETURNING id INTO v_address_id;
  END IF;

  RETURN v_address_id;
END;
$$;

-- Upsert guest billing address
CREATE OR REPLACE FUNCTION upsert_guest_billing_address(
  p_guest_id UUID,
  p_line_1 TEXT DEFAULT NULL,
  p_line_2 TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_zip_code TEXT DEFAULT NULL,
  p_country TEXT DEFAULT 'US'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_address_id UUID;
BEGIN
  -- Try to update existing default billing address
  UPDATE addresses
  SET
    line_1 = p_line_1,
    line_2 = p_line_2,
    city = p_city,
    state = p_state,
    zip_code = p_zip_code,
    country = p_country,
    updated_at = NOW()
  WHERE guest_id = p_guest_id
    AND address_type = 'billing'
    AND is_default = true
  RETURNING id INTO v_address_id;

  -- If no existing address, create one
  IF v_address_id IS NULL THEN
    INSERT INTO addresses (
      guest_id, line_1, line_2, city, state, zip_code, country,
      address_type, is_default
    )
    VALUES (
      p_guest_id, p_line_1, p_line_2, p_city, p_state, p_zip_code, p_country,
      'billing', true
    )
    RETURNING id INTO v_address_id;
  END IF;

  RETURN v_address_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_profile_billing_address(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guest_billing_address(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_profile_addresses(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_profile_billing_address(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_guest_billing_address(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Comments
COMMENT ON FUNCTION get_profile_billing_address IS 'Get default billing address for a profile';
COMMENT ON FUNCTION get_guest_billing_address IS 'Get default billing address for a guest';
COMMENT ON FUNCTION get_profile_addresses IS 'Get all addresses for a profile';
COMMENT ON FUNCTION upsert_profile_billing_address IS 'Create or update default billing address for a profile';
COMMENT ON FUNCTION upsert_guest_billing_address IS 'Create or update default billing address for a guest';
