-- ============================================
-- Fix: Add missing GRANTs for guest_list_settings table
-- ============================================
-- The guest_list_settings table was created with RLS policies but missing
-- GRANT permissions. Without GRANTs, all operations fail with 403 Forbidden
-- even if RLS policies would allow them.

-- Grant authenticated users permission to perform CRUD operations
-- (RLS policies will still control which specific rows they can access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_list_settings TO authenticated;

-- Grant anonymous users read access for public event settings
-- (RLS policy already restricts this to published events only)
GRANT SELECT ON public.guest_list_settings TO anon;
