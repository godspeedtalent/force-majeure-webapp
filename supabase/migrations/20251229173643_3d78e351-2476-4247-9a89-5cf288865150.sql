-- Grant SELECT permission on the users_complete view to authenticated and service_role
GRANT SELECT ON public.users_complete TO authenticated;
GRANT SELECT ON public.users_complete TO service_role;