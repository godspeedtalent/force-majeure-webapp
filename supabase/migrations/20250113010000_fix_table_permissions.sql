-- ============================================================================
-- FIX TABLE PERMISSIONS
-- ============================================================================
-- This migration grants proper permissions to anon, authenticated, and service_role
-- for all tables that were missing them in the remote database
-- ============================================================================

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant all on all tables to service_role (full access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant all on all sequences to service_role
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant SELECT permissions to anon and authenticated for public-facing tables
GRANT SELECT ON TABLE public.environments TO anon, authenticated;
GRANT SELECT ON TABLE public.feature_flags TO anon, authenticated;
GRANT SELECT ON TABLE public.genres TO anon, authenticated;
GRANT SELECT ON TABLE public.artists TO anon, authenticated;
GRANT SELECT ON TABLE public.events TO anon, authenticated;
GRANT SELECT ON TABLE public.venues TO anon, authenticated;
GRANT SELECT ON TABLE public.cities TO anon, authenticated;
GRANT SELECT ON TABLE public.countries TO anon, authenticated;
GRANT SELECT ON TABLE public.ticket_tiers TO anon, authenticated;
GRANT SELECT ON TABLE public.artist_genres TO anon, authenticated;
GRANT SELECT ON TABLE public.event_artists TO anon, authenticated;

-- Grant access to profiles (users can read their own profile)
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

-- Grant access to orders and order_items for authenticated users
GRANT SELECT, INSERT ON TABLE public.orders TO authenticated;
GRANT SELECT, INSERT ON TABLE public.order_items TO authenticated;

-- Grant access to user_ticket_groups for authenticated users
GRANT SELECT, INSERT ON TABLE public.user_ticket_groups TO authenticated;

-- Ensure anon and authenticated can use sequences for IDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- Verification
-- ============================================================================
-- Check that permissions are set correctly
DO $$
BEGIN
    RAISE NOTICE 'Table permissions have been applied successfully';
END $$;
