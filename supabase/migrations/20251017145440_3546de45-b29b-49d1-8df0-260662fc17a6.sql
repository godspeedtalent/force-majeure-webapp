-- Create ticket tiers table
CREATE TABLE public.ticket_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  total_tickets INTEGER NOT NULL,
  tickets_sold INTEGER NOT NULL DEFAULT 0,
  tier_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  hide_until_previous_sold_out BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Ticket tiers are publicly viewable"
ON public.ticket_tiers
FOR SELECT
USING (is_active = true);

-- Create index for efficient querying
CREATE INDEX idx_ticket_tiers_event_id ON public.ticket_tiers(event_id);
CREATE INDEX idx_ticket_tiers_tier_order ON public.ticket_tiers(tier_order);

-- Add trigger for updated_at
CREATE TRIGGER update_ticket_tiers_updated_at
  BEFORE UPDATE ON public.ticket_tiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();