-- Create venues table
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  capacity INTEGER,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Create policy for public viewing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'venues'
    AND policyname = 'Venues are publicly viewable'
  ) THEN
    CREATE POLICY "Venues are publicly viewable"
    ON public.venues
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Add trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_venues_updated_at ON public.venues;
CREATE TRIGGER update_venues_updated_at
BEFORE UPDATE ON public.venues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing venue data to new table and add foreign key
DO $$
DECLARE
    event_record RECORD;
    v_venue_id UUID;  -- Renamed to avoid ambiguity
BEGIN
    -- First, create venue records from existing event venue texts and update events
    FOR event_record IN SELECT id, venue FROM public.events WHERE venue IS NOT NULL LOOP
        -- Check if venue already exists
        SELECT id INTO v_venue_id FROM public.venues WHERE name = event_record.venue;

        -- If venue doesn't exist, create it
        IF v_venue_id IS NULL THEN
            INSERT INTO public.venues (name)
            VALUES (event_record.venue)
            RETURNING id INTO v_venue_id;
        END IF;

        -- Update event with venue_id (we'll add the column first)
        -- This is done after we add the venue_id column below
    END LOOP;
END $$;

-- Add venue_id column to events table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='venue_id') THEN
    ALTER TABLE public.events ADD COLUMN venue_id UUID;
  END IF;
END $$;

-- Update events with venue_id based on venue name
DO $$
DECLARE
    event_record RECORD;
    v_venue_id UUID;  -- Renamed to avoid ambiguity
BEGIN
    FOR event_record IN SELECT id, venue FROM public.events WHERE venue IS NOT NULL LOOP
        SELECT id INTO v_venue_id FROM public.venues WHERE name = event_record.venue;
        UPDATE public.events SET venue_id = v_venue_id WHERE id = event_record.id;
    END LOOP;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_events_venue_id'
    AND table_name = 'events'
  ) THEN
    ALTER TABLE public.events
    ADD CONSTRAINT fk_events_venue_id
    FOREIGN KEY (venue_id) REFERENCES public.venues(id);
  END IF;
END $$;

-- Drop the old venue text column if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='venue') THEN
    ALTER TABLE public.events DROP COLUMN venue;
  END IF;
END $$;
