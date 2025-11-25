-- Grant missing INSERT, UPDATE, DELETE permissions on ticket_tiers to authenticated role
-- This fixes "permission denied for table ticket_tiers" error during event creation
GRANT INSERT, UPDATE, DELETE ON public.ticket_tiers TO authenticated;

-- Also grant permissions on related ticketing tables that authenticated users need to modify
GRANT INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ticket_holds TO authenticated;

-- Grant on tickets table for when orders are completed
GRANT INSERT, UPDATE, DELETE ON public.tickets TO authenticated;