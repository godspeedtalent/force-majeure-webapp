-- Add RLS policies for event_artists to allow org members with manage_events permission
-- to manage event artists for their organization's events

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage event artists" ON public.event_artists;

-- Create new policies that allow both admins and org members with manage_events permission

-- SELECT policy (already publicly viewable, keep it)
-- Policy "Event artists are publicly viewable" already exists

-- INSERT policy
CREATE POLICY "Admins and org members can insert event artists"
ON public.event_artists
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL) AND (
    has_role(auth.uid(), 'admin'::text) OR 
    is_dev_admin(auth.uid()) OR
    (
      has_permission(auth.uid(), 'manage_events'::text) AND
      EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.profiles p ON p.organization_id = e.organization_id
        WHERE e.id = event_artists.event_id
        AND p.user_id = auth.uid()
      )
    )
  )
);

-- UPDATE policy
CREATE POLICY "Admins and org members can update event artists"
ON public.event_artists
FOR UPDATE
USING (
  (auth.uid() IS NOT NULL) AND (
    has_role(auth.uid(), 'admin'::text) OR 
    is_dev_admin(auth.uid()) OR
    (
      has_permission(auth.uid(), 'manage_events'::text) AND
      EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.profiles p ON p.organization_id = e.organization_id
        WHERE e.id = event_artists.event_id
        AND p.user_id = auth.uid()
      )
    )
  )
);

-- DELETE policy
CREATE POLICY "Admins and org members can delete event artists"
ON public.event_artists
FOR DELETE
USING (
  (auth.uid() IS NOT NULL) AND (
    has_role(auth.uid(), 'admin'::text) OR 
    is_dev_admin(auth.uid()) OR
    (
      has_permission(auth.uid(), 'manage_events'::text) AND
      EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.profiles p ON p.organization_id = e.organization_id
        WHERE e.id = event_artists.event_id
        AND p.user_id = auth.uid()
      )
    )
  )
);