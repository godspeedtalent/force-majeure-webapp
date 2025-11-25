-- Grant missing INSERT permission on organizations to authenticated role
-- This fixes "permission denied for table organizations" error during org creation
GRANT INSERT ON public.organizations TO authenticated;