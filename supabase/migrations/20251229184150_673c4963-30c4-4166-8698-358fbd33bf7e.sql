-- Grant permissions to authenticated users for tables missing GRANTs
-- These tables have RLS policies but are missing the base table permissions

-- profiles table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- scavenger_locations table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scavenger_locations TO authenticated;

-- scavenger_claims table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scavenger_claims TO authenticated;

-- tracking_links table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tracking_links TO authenticated;

-- rave_family table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rave_family TO authenticated;

-- webhook_events table (if it exists)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_events TO authenticated;

-- user_event_interests table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_event_interests TO authenticated;

-- user_requests table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_requests TO authenticated;

-- ticket_scans table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_scans TO authenticated;

-- activity_logs_archive table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs_archive TO authenticated;

-- Also grant to anon role for public-facing tables that need it
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.scavenger_locations TO anon;