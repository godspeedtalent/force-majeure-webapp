-- Allow public read access to event_artists table
-- This is needed so unauthenticated users can view undercard artists on event cards

-- Drop the existing policy if it has a different name
DROP POLICY IF EXISTS "Event artists are publicly viewable" ON public.event_artists;

-- Create the public select policy
CREATE POLICY "Event artists are publicly viewable"
ON public.event_artists
FOR SELECT
TO anon, authenticated
USING (true);