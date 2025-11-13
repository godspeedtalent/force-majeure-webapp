-- Migration: Add Environments Table and Update Environment References
-- Created: 2025-11-10
-- Description: Creates environments reference table and migrates feature_flags and ticketing_fees to use environment_id foreign keys

-- ============================================================================
-- Create Environments Reference Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('dev', 'qa', 'prod', 'all')),
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.environments IS 'Reference table for deployment environments (dev, qa, prod, all). Used for environment-specific configuration.';
COMMENT ON COLUMN public.environments.name IS 'Short environment identifier used in code and queries';
COMMENT ON COLUMN public.environments.display_name IS 'Human-readable environment name for UI display';
COMMENT ON COLUMN public.environments.is_active IS 'Whether this environment is currently active/available';

-- ============================================================================
-- Seed Default Environments
-- ============================================================================

INSERT INTO public.environments (name, display_name, description) VALUES
  ('dev', 'Development', 'Local development and testing environment'),
  ('qa', 'QA/Staging', 'Quality assurance and pre-production testing'),
  ('prod', 'Production', 'Live production environment'),
  ('all', 'All Environments', 'Configuration applies to all environments')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Enable RLS on Environments
-- ============================================================================

ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;

-- Everyone can view environments
CREATE POLICY "Anyone can view environments"
  ON public.environments FOR SELECT
  USING (true);

-- Only admins can manage environments
CREATE POLICY "Admins can manage environments"
  ON public.environments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ============================================================================
-- Migrate Feature Flags to Use Environment Foreign Key
-- ============================================================================

-- Add environment_id column
ALTER TABLE public.feature_flags 
  ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES public.environments(id);

-- Migrate existing data from environment string to environment_id
UPDATE public.feature_flags ff
SET environment_id = e.id
FROM public.environments e
WHERE ff.environment = e.name
AND ff.environment_id IS NULL;

-- Make environment_id required after migration
ALTER TABLE public.feature_flags 
  ALTER COLUMN environment_id SET NOT NULL;

-- Add unique constraint for the new environment_id column
ALTER TABLE public.feature_flags
  ADD CONSTRAINT feature_flags_flag_name_environment_id_key 
  UNIQUE (flag_name, environment_id);

-- Drop the old unique constraint on (flag_name, environment)
ALTER TABLE public.feature_flags
  DROP CONSTRAINT IF EXISTS feature_flags_flag_name_environment_key;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment_id 
  ON public.feature_flags(environment_id);

-- Add column comment
COMMENT ON COLUMN public.feature_flags.environment_id IS 'References environments table - replaces environment column';

-- ============================================================================
-- Migrate Ticketing Fees to Use Environment Foreign Key
-- ============================================================================

-- Add environment_id column
ALTER TABLE public.ticketing_fees
  ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES public.environments(id);

-- Migrate existing data from environment string to environment_id
UPDATE public.ticketing_fees tf
SET environment_id = e.id
FROM public.environments e
WHERE tf.environment = e.name
AND tf.environment_id IS NULL;

-- Make environment_id required after migration
ALTER TABLE public.ticketing_fees
  ALTER COLUMN environment_id SET NOT NULL;

-- Add unique constraint for the new environment_id column
ALTER TABLE public.ticketing_fees
  ADD CONSTRAINT ticketing_fees_fee_name_environment_id_key 
  UNIQUE (fee_name, environment_id);

-- Drop the old unique constraint on (fee_name, environment)
ALTER TABLE public.ticketing_fees
  DROP CONSTRAINT IF EXISTS ticketing_fees_fee_name_environment_key;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_ticketing_fees_environment_id
  ON public.ticketing_fees(environment_id);

-- Add column comment
COMMENT ON COLUMN public.ticketing_fees.environment_id IS 'References environments table - replaces environment column';

-- ============================================================================
-- Update Feature Flags Seed Data
-- ============================================================================

-- Delete existing feature flags to re-seed with proper environment_id
DELETE FROM public.feature_flags;

-- Re-seed feature flags with environment references
INSERT INTO public.feature_flags (flag_name, is_enabled, environment_id, description)
SELECT 
  'coming_soon_mode',
  false,
  e.id,
  'Shows coming soon page instead of main app'
FROM public.environments e
WHERE e.name = 'all'
ON CONFLICT (flag_name, environment_id) DO NOTHING;

INSERT INTO public.feature_flags (flag_name, is_enabled, environment_id, description)
SELECT 
  'dev_mode',
  CASE WHEN e.name IN ('dev', 'qa') THEN true ELSE false END,
  e.id,
  'Enable developer tools and debug features'
FROM public.environments e
WHERE e.name IN ('dev', 'qa', 'prod')
ON CONFLICT (flag_name, environment_id) DO NOTHING;

INSERT INTO public.feature_flags (flag_name, is_enabled, environment_id, description)
SELECT 
  'scavenger_hunt',
  false,
  e.id,
  'Enable scavenger hunt game feature'
FROM public.environments e
WHERE e.name = 'all'
ON CONFLICT (flag_name, environment_id) DO NOTHING;

INSERT INTO public.feature_flags (flag_name, is_enabled, environment_id, description)
SELECT 
  'global_search',
  true,
  e.id,
  'Enable global search functionality'
FROM public.environments e
WHERE e.name = 'all'
ON CONFLICT (flag_name, environment_id) DO NOTHING;

INSERT INTO public.feature_flags (flag_name, is_enabled, environment_id, description)
SELECT 
  'demo_pages',
  CASE WHEN e.name IN ('dev', 'qa') THEN true ELSE false END,
  e.id,
  'Enable demo and testing pages'
FROM public.environments e
WHERE e.name IN ('dev', 'qa', 'prod')
ON CONFLICT (flag_name, environment_id) DO NOTHING;

-- ============================================================================
-- Update Ticketing Fees Seed Data
-- ============================================================================

-- Delete existing fees to re-seed with proper environment_id
DELETE FROM public.ticketing_fees;

-- Re-seed ticketing fees with environment references
INSERT INTO public.ticketing_fees (fee_name, fee_type, fee_value, is_active, environment_id)
SELECT 
  'Service Fee',
  'percentage',
  10.0,
  true,
  e.id
FROM public.environments e
WHERE e.name = 'all'
ON CONFLICT (fee_name, environment_id) DO NOTHING;

INSERT INTO public.ticketing_fees (fee_name, fee_type, fee_value, is_active, environment_id)
SELECT 
  'Processing Fee',
  'flat',
  2.50,
  true,
  e.id
FROM public.environments e
WHERE e.name = 'all'
ON CONFLICT (fee_name, environment_id) DO NOTHING;

-- ============================================================================
-- Optional: Drop Old Environment Columns (Uncomment when ready)
-- ============================================================================

-- After verifying migration is successful, you can drop the old columns:
-- ALTER TABLE public.feature_flags DROP COLUMN IF EXISTS environment;
-- ALTER TABLE public.ticketing_fees DROP COLUMN IF EXISTS environment;
