-- Add environment column to feature_flags table
ALTER TABLE public.feature_flags
ADD COLUMN environment text NOT NULL DEFAULT 'all'
CHECK (environment IN ('dev', 'prod', 'all'));

-- Add comment for documentation
COMMENT ON COLUMN public.feature_flags.environment IS 'Environment where this flag is active: dev, prod, or all';

-- Create index for better query performance
CREATE INDEX idx_feature_flags_environment ON public.feature_flags(environment);

-- Update existing flags to 'all' (already default, but explicit)
UPDATE public.feature_flags
SET environment = 'all'
WHERE environment IS NULL;

-- Add RLS policy comment for future reference
COMMENT ON TABLE public.feature_flags IS 'Feature flags with environment-specific controls. Use environment column to scope flags to dev, prod, or all environments.';