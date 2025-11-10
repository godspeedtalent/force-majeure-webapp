-- Create cities table
CREATE TABLE public.cities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  state text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(name, state)
);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Cities are publicly viewable
CREATE POLICY "Cities are publicly viewable"
ON public.cities
FOR SELECT
TO authenticated, anon
USING (true);

-- Only admins can manage cities
CREATE POLICY "Admins can insert cities"
ON public.cities
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update cities"
ON public.cities
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete cities"
ON public.cities
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial cities
INSERT INTO public.cities (name, state) VALUES
  ('Austin', 'TX'),
  ('San Marcos', 'TX');

-- Add city_id to venues table
ALTER TABLE public.venues ADD COLUMN city_id uuid REFERENCES public.cities(id);

-- Create an index for faster lookups
CREATE INDEX idx_venues_city_id ON public.venues(city_id);

-- Update trigger for cities
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON public.cities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();