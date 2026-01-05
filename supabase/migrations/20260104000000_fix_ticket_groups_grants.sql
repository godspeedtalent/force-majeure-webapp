-- ============================================
-- Fix ticket_groups table GRANT permissions
-- ============================================
-- The ticket_groups table has proper RLS policies but the GRANTs were
-- revoked by a previous migration, causing 403 Forbidden errors.
-- This migration restores the necessary permissions.

-- Grant permissions to authenticated users (for admin/developer CRUD)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_groups TO authenticated;

-- Grant SELECT to anon for public viewing of ticket groups
GRANT SELECT ON public.ticket_groups TO anon;
