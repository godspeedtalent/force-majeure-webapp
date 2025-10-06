-- Add RLS policy for scavenger_locations to allow public viewing of active locations
CREATE POLICY "Active locations are publicly viewable"
ON public.scavenger_locations
FOR SELECT
USING (is_active = true);