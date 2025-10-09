-- First, let's add the new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='headliner_id') THEN
    ALTER TABLE public.events ADD COLUMN headliner_id uuid REFERENCES public.artists(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='undercard_ids') THEN
    ALTER TABLE public.events ADD COLUMN undercard_ids uuid[] DEFAULT '{}';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_headliner_id ON public.events(headliner_id);
CREATE INDEX IF NOT EXISTS idx_events_undercard_ids ON public.events USING gin(undercard_ids);

-- Drop the old JSONB columns after adding the new ones (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='headliner') THEN
    ALTER TABLE public.events DROP COLUMN headliner;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='undercard') THEN
    ALTER TABLE public.events DROP COLUMN undercard;
  END IF;
END $$;
