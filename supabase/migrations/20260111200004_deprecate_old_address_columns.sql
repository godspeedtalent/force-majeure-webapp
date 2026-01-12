-- ============================================
-- DEPRECATION NOTICES
-- ============================================
--
-- Mark old address columns as deprecated. Columns remain for backward
-- compatibility during the transition period. They will be removed in
-- a future migration after all application code is updated.
--

-- Profiles table deprecation comments
COMMENT ON COLUMN profiles.billing_address_line_1 IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN profiles.billing_address_line_2 IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN profiles.billing_city IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN profiles.billing_state IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN profiles.billing_zip_code IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN profiles.billing_country IS '@deprecated Use addresses table instead. Will be removed after transition period.';

-- Guests table deprecation comments
COMMENT ON COLUMN guests.billing_address_line_1 IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN guests.billing_address_line_2 IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN guests.billing_city IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN guests.billing_state IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN guests.billing_zip_code IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN guests.billing_country IS '@deprecated Use addresses table instead. Will be removed after transition period.';

-- Organizations table deprecation comments
COMMENT ON COLUMN organizations.address_line_1 IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN organizations.address_line_2 IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN organizations.city IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN organizations.state IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN organizations.zip_code IS '@deprecated Use addresses table instead. Will be removed after transition period.';
COMMENT ON COLUMN organizations.country IS '@deprecated Use addresses table instead. Will be removed after transition period.';

-- NOTE: orders.billing_* columns are NOT deprecated - they intentionally
-- store a snapshot of the billing address at purchase time for historical
-- accuracy and audit purposes.
