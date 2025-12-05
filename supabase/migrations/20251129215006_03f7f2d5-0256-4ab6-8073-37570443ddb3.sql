-- Grant DELETE permission to authenticated role for event_artists table
-- This is required in addition to RLS policies for DELETE operations to work
GRANT DELETE ON TABLE public.event_artists TO authenticated;

-- Also ensure INSERT and UPDATE grants are present (they should be, but let's be explicit)
GRANT INSERT, UPDATE ON TABLE public.event_artists TO authenticated;