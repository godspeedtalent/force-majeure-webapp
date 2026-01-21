-- ============================================
-- Consolidate guest list minimum thresholds
-- ============================================
-- Previously had separate thresholds for interested, private, and public guests.
-- Now consolidating to a single min_guest_threshold that applies to all types.

-- Add the consolidated threshold column
ALTER TABLE public.guest_list_settings
  ADD COLUMN IF NOT EXISTS min_guest_threshold INTEGER NOT NULL DEFAULT 0;

-- Migrate existing data: use the maximum of the three existing thresholds
UPDATE public.guest_list_settings
SET min_guest_threshold = GREATEST(
  COALESCE(min_interested_guests, 0),
  COALESCE(min_private_guests, 0),
  COALESCE(min_public_guests, 0)
)
WHERE min_guest_threshold = 0;

-- Note: Keeping old columns for backward compatibility
-- They can be deprecated in a future migration once all code is updated
