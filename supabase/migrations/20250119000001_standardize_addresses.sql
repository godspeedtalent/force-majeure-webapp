-- Migration: Standardize Address Storage
-- This migration standardizes address storage across all tables using US postal standards
-- Address format: address_line_1, address_line_2, city, state, zip_code, country

-- ============================================================================
-- Venues Table - Update Address Fields
-- ============================================================================

-- Add new standardized address fields to venues
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS address_line_1 TEXT,
ADD COLUMN IF NOT EXISTS address_line_2 TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Migrate existing data: move 'address' to 'address_line_1'
UPDATE venues
SET address_line_1 = address
WHERE address IS NOT NULL AND address_line_1 IS NULL;

-- Drop old address column (commented out for safety - uncomment after verification)
-- ALTER TABLE venues DROP COLUMN IF EXISTS address;

-- Add constraints for address validation
ALTER TABLE venues
ADD CONSTRAINT venues_state_format CHECK (state IS NULL OR state ~ '^[A-Z]{2}$'),
ADD CONSTRAINT venues_zip_format CHECK (zip_code IS NULL OR zip_code ~ '^\d{5}(-\d{4})?$');

-- ============================================================================
-- Profiles Table - Update Billing Address Fields
-- ============================================================================

-- Add address_line_2 for billing addresses
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS billing_address_line_2 TEXT;

-- Rename billing_address to billing_address_line_1 for consistency
-- Note: This uses a rename to preserve data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'billing_address'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN billing_address TO billing_address_line_1;
  END IF;
END $$;

-- Rename billing_zip to billing_zip_code for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'billing_zip'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN billing_zip TO billing_zip_code;
  END IF;
END $$;

-- Add country field with default 'US'
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS billing_country TEXT DEFAULT 'US';

-- Update existing constraints and add new ones
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS billing_state_format,
DROP CONSTRAINT IF EXISTS billing_zip_format;

ALTER TABLE profiles
ADD CONSTRAINT billing_state_format CHECK (billing_state IS NULL OR billing_state ~ '^[A-Z]{2}$'),
ADD CONSTRAINT billing_zip_code_format CHECK (billing_zip_code IS NULL OR billing_zip_code ~ '^\d{5}(-\d{4})?$'),
ADD CONSTRAINT billing_country_format CHECK (billing_country IS NULL OR length(billing_country) = 2);

-- ============================================================================
-- Organizations Table - Add Address Fields
-- ============================================================================

-- Add address fields to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS address_line_1 TEXT,
ADD COLUMN IF NOT EXISTS address_line_2 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';

-- Add constraints for organization addresses
ALTER TABLE organizations
ADD CONSTRAINT org_state_format CHECK (state IS NULL OR state ~ '^[A-Z]{2}$'),
ADD CONSTRAINT org_zip_format CHECK (zip_code IS NULL OR zip_code ~ '^\d{5}(-\d{4})?$'),
ADD CONSTRAINT org_country_format CHECK (country IS NULL OR length(country) = 2);

-- ============================================================================
-- Orders Table - Ensure Billing Address Consistency
-- ============================================================================

-- Check if orders table has address fields and standardize them
DO $$
BEGIN
  -- Add address fields if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'billing_address_line_1'
  ) THEN
    ALTER TABLE orders
    ADD COLUMN billing_address_line_1 TEXT,
    ADD COLUMN billing_address_line_2 TEXT,
    ADD COLUMN billing_city TEXT,
    ADD COLUMN billing_state TEXT,
    ADD COLUMN billing_zip_code TEXT,
    ADD COLUMN billing_country TEXT DEFAULT 'US';
  END IF;

  -- Rename old columns if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'billing_address'
  ) THEN
    ALTER TABLE orders RENAME COLUMN billing_address TO billing_address_line_1;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'billing_zip'
  ) THEN
    ALTER TABLE orders RENAME COLUMN billing_zip TO billing_zip_code;
  END IF;
END $$;

-- Add constraints for order billing addresses
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS order_billing_state_format,
DROP CONSTRAINT IF EXISTS order_billing_zip_format;

ALTER TABLE orders
ADD CONSTRAINT order_billing_state_format CHECK (billing_state IS NULL OR billing_state ~ '^[A-Z]{2}$'),
ADD CONSTRAINT order_billing_zip_code_format CHECK (billing_zip_code IS NULL OR billing_zip_code ~ '^\d{5}(-\d{4})?$'),
ADD CONSTRAINT order_billing_country_format CHECK (billing_country IS NULL OR length(billing_country) = 2);

-- ============================================================================
-- Comments and Documentation
-- ============================================================================

COMMENT ON COLUMN venues.address_line_1 IS 'Street address (e.g., 123 Main St)';
COMMENT ON COLUMN venues.address_line_2 IS 'Apartment, suite, unit, building, floor, etc.';
COMMENT ON COLUMN venues.city IS 'City name';
COMMENT ON COLUMN venues.state IS 'Two-letter state code (e.g., CA, NY)';
COMMENT ON COLUMN venues.zip_code IS 'ZIP code (5 digits or ZIP+4 format)';

COMMENT ON COLUMN profiles.billing_address_line_1 IS 'Billing street address';
COMMENT ON COLUMN profiles.billing_address_line_2 IS 'Billing apartment, suite, etc.';
COMMENT ON COLUMN profiles.billing_city IS 'Billing city';
COMMENT ON COLUMN profiles.billing_state IS 'Billing state (two-letter code)';
COMMENT ON COLUMN profiles.billing_zip_code IS 'Billing ZIP code';
COMMENT ON COLUMN profiles.billing_country IS 'Billing country (two-letter ISO code)';

COMMENT ON COLUMN organizations.address_line_1 IS 'Organization street address';
COMMENT ON COLUMN organizations.address_line_2 IS 'Organization apartment, suite, etc.';
COMMENT ON COLUMN organizations.city IS 'Organization city';
COMMENT ON COLUMN organizations.state IS 'Organization state (two-letter code)';
COMMENT ON COLUMN organizations.zip_code IS 'Organization ZIP code';
COMMENT ON COLUMN organizations.country IS 'Organization country (two-letter ISO code)';
