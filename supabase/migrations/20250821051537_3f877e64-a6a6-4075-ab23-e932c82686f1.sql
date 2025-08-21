-- First, let's add the new columns
ALTER TABLE public.events 
ADD COLUMN headliner_id uuid REFERENCES public.artists(id),
ADD COLUMN undercard_ids uuid[] DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX idx_events_headliner_id ON public.events(headliner_id);
CREATE INDEX idx_events_undercard_ids ON public.events USING gin(undercard_ids);

-- Drop the old JSONB columns after adding the new ones
ALTER TABLE public.events 
DROP COLUMN headliner,
DROP COLUMN undercard;