-- Fix events table RLS policies to allow unauthenticated public access
-- The issue is that RESTRICTIVE policies were trying to check profiles table even for anon users

-- Drop existing SELECT policies on events
DROP POLICY IF EXISTS "Published events are publicly viewable" ON public.events;
DROP POLICY IF EXISTS "Privileged users can view all events" ON public.events;

-- Recreate as PERMISSIVE policies (at least one must pass, not all)
-- This ensures public access works without evaluating the profiles check

-- Public can view published events (no auth required)
CREATE POLICY "Published events are publicly viewable"
ON public.events
FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Privileged users can view all events (auth required, checks profiles for org membership)
CREATE POLICY "Privileged users can view all events"  
ON public.events
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'developer') OR 
    is_dev_admin(auth.uid()) OR
    (
      has_permission(auth.uid(), 'manage_events') AND 
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.organization_id = events.organization_id
      )
    )
  )
);