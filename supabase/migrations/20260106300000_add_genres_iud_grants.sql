-- Add INSERT, UPDATE, DELETE grants for genres table
-- The RLS policies already exist to restrict these operations to admin/developer roles,
-- but the GRANT permissions were missing which caused INSERT to fail with permission denied.
--
-- See docs/backend/RLS_AND_GRANTS_GUIDE.md - BOTH GRANT and RLS are required for Supabase

-- Grant INSERT, UPDATE, DELETE to authenticated users (RLS policies will restrict to admin/developer)
GRANT INSERT, UPDATE, DELETE ON TABLE public.genres TO authenticated;
