-- ============================================
-- MIGRATE EXISTING ADDRESS DATA
-- ============================================
--
-- This migration copies existing address data from profiles, guests,
-- and organizations into the new normalized addresses table.
-- Original columns are kept for backward compatibility.
--

-- 1. Migrate profile billing addresses
INSERT INTO addresses (
  profile_id,
  line_1,
  line_2,
  city,
  state,
  zip_code,
  country,
  address_type,
  is_default,
  created_at,
  updated_at
)
SELECT
  p.id,
  p.billing_address_line_1,
  p.billing_address_line_2,
  p.billing_city,
  p.billing_state,
  p.billing_zip_code,
  COALESCE(p.billing_country, 'US'),
  'billing'::address_type,
  true,
  p.created_at,
  COALESCE(p.updated_at, p.created_at)
FROM profiles p
WHERE p.billing_address_line_1 IS NOT NULL
   OR p.billing_city IS NOT NULL
   OR p.billing_state IS NOT NULL
   OR p.billing_zip_code IS NOT NULL
ON CONFLICT DO NOTHING;

-- 2. Migrate guest billing addresses
INSERT INTO addresses (
  guest_id,
  line_1,
  line_2,
  city,
  state,
  zip_code,
  country,
  address_type,
  is_default,
  created_at,
  updated_at
)
SELECT
  g.id,
  g.billing_address_line_1,
  g.billing_address_line_2,
  g.billing_city,
  g.billing_state,
  g.billing_zip_code,
  COALESCE(g.billing_country, 'US'),
  'billing'::address_type,
  true,
  g.created_at,
  COALESCE(g.updated_at, g.created_at)
FROM guests g
WHERE g.billing_address_line_1 IS NOT NULL
   OR g.billing_city IS NOT NULL
   OR g.billing_state IS NOT NULL
   OR g.billing_zip_code IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Migrate organization addresses (as headquarters type)
INSERT INTO addresses (
  organization_id,
  line_1,
  line_2,
  city,
  state,
  zip_code,
  country,
  address_type,
  is_default,
  created_at,
  updated_at
)
SELECT
  o.id,
  o.address_line_1,
  o.address_line_2,
  o.city,
  o.state,
  o.zip_code,
  COALESCE(o.country, 'US'),
  'headquarters'::address_type,
  true,
  o.created_at,
  COALESCE(o.updated_at, o.created_at)
FROM organizations o
WHERE o.address_line_1 IS NOT NULL
   OR o.city IS NOT NULL
   OR o.state IS NOT NULL
   OR o.zip_code IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Log migration counts
DO $$
DECLARE
  profile_count INTEGER;
  guest_count INTEGER;
  org_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM addresses WHERE profile_id IS NOT NULL;
  SELECT COUNT(*) INTO guest_count FROM addresses WHERE guest_id IS NOT NULL;
  SELECT COUNT(*) INTO org_count FROM addresses WHERE organization_id IS NOT NULL;
  total_count := profile_count + guest_count + org_count;

  RAISE NOTICE 'Address migration complete:';
  RAISE NOTICE '  - Profile addresses: %', profile_count;
  RAISE NOTICE '  - Guest addresses: %', guest_count;
  RAISE NOTICE '  - Organization addresses: %', org_count;
  RAISE NOTICE '  - Total: %', total_count;
END $$;
