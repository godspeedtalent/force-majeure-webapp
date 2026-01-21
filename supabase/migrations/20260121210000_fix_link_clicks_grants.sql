-- Fix tracking_links and link_clicks table grants
-- The remote_schema migration revoked all grants, which blocks access entirely
-- Even with RLS policies, users need base-level GRANTs to access the table

-- =============================================================================
-- tracking_links grants
-- =============================================================================

-- Grant SELECT to anon (tracking links are publicly viewable per RLS policy)
GRANT SELECT ON public.tracking_links TO anon;

-- Grant full CRUD to authenticated users (controlled by RLS policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracking_links TO authenticated;

-- Ensure service_role has full access (required for edge functions)
GRANT ALL ON public.tracking_links TO service_role;

-- =============================================================================
-- link_clicks grants
-- =============================================================================

-- Grant SELECT to authenticated users (controlled by RLS policies)
GRANT SELECT ON public.link_clicks TO authenticated;

-- Grant INSERT to authenticated users (for edge function fallback via authenticated session)
-- Note: The edge function uses service_role which bypasses RLS, but this is still needed
GRANT INSERT ON public.link_clicks TO authenticated;

-- Grant SELECT and INSERT to anon for public tracking link redirects
-- The edge function uses service_role, but this ensures compatibility
GRANT SELECT ON public.link_clicks TO anon;
GRANT INSERT ON public.link_clicks TO anon;

-- Ensure service_role has full access (required for edge functions)
GRANT ALL ON public.link_clicks TO service_role;
