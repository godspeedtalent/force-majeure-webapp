-- ============================================================================
-- Fix Feature Flags Update Permission
-- ============================================================================
-- The migration 20251204155717_remote_schema.sql revoked UPDATE permission
-- from authenticated users on feature_flags table. This prevents admins from
-- updating feature flags even though the RLS policy allows it.
--
-- For RLS to work correctly, both conditions must be met:
-- 1. Base table permission (GRANT UPDATE) - allows the operation at all
-- 2. RLS policy - controls WHO can perform the operation
--
-- This migration restores the UPDATE permission so the existing RLS policy
-- "Admins can update feature flags" can work as intended.
-- ============================================================================

-- Grant UPDATE permission back to authenticated users
-- (RLS policy still restricts this to admins only)
GRANT UPDATE ON TABLE public.feature_flags TO authenticated;

-- Also ensure INSERT is available for admins (in case they need to create new flags)
GRANT INSERT ON TABLE public.feature_flags TO authenticated;

-- Verify the existing RLS policies are still in place
-- These policies ensure only admins can actually perform these operations:
-- - "Admins can update feature flags" (for UPDATE)
-- - "Admins can insert feature flags" (for INSERT)
