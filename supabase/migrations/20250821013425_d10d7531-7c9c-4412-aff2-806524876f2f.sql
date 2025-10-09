-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  headliner JSONB NOT NULL, -- {name: string, genre: string}
  undercard JSONB[] DEFAULT '{}', -- array of {name: string, genre: string}
  date DATE NOT NULL,
  time TEXT NOT NULL,
  venue TEXT NOT NULL,
  location TEXT NOT NULL,
  hero_image TEXT,
  description TEXT,
  ticket_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (events are public)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'events'
    AND policyname = 'Events are publicly viewable'
  ) THEN
    CREATE POLICY "Events are publicly viewable"
    ON public.events
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the two events
INSERT INTO public.events (
  title,
  headliner,
  undercard,
  date,
  time,
  venue,
  location,
  hero_image,
  description,
  ticket_url
) VALUES (
  'Ninajirachi',
  '{"name": "Ninajirachi", "genre": "Electronic"}',
  '[
    {"name": "Syzy", "genre": "Electronic"},
    {"name": "MEA CULPA", "genre": "Electronic"},
    {"name": "45AM", "genre": "Electronic"}
  ]',
  '2024-09-26',
  '9:00 PM',
  'The Parish',
  'New Orleans, LA',
  'https://images.unsplash.com/photo-1571266028243-d220c9c814d2?w=800&h=800&fit=crop',
  'An unforgettable night of cutting-edge electronic music featuring Ninajirachi and special guests.',
  '#'
), (
  'LF SYSTEM',
  '{"name": "LF SYSTEM", "genre": "Electronic"}',
  '[
    {"name": "GODSPEED", "genre": "Electronic"},
    {"name": "DiLLZ", "genre": "Electronic"},
    {"name": "Shep", "genre": "Electronic"},
    {"name": "Stalekale", "genre": "Electronic"}
  ]',
  '2024-10-18',
  '10:00 PM',
  'Kingdom Night Club',
  'Austin, TX',
  'https://images.unsplash.com/photo-1574391884720-bfab8cb872b4?w=800&h=800&fit=crop',
  'Experience the future of electronic music with LF SYSTEM and an incredible lineup of supporting artists.',
  '#'
)
ON CONFLICT (id) DO NOTHING;