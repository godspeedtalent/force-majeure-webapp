-- Create merch table
CREATE TABLE IF NOT EXISTS public.merch (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Limited Prints', 'Stickers')),
  image_url TEXT,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.merch ENABLE ROW LEVEL SECURITY;

-- Create policy for public viewing of merch
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'merch'
    AND policyname = 'Merch items are publicly viewable'
  ) THEN
    CREATE POLICY "Merch items are publicly viewable"
    ON public.merch
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_merch_updated_at ON public.merch;
CREATE TRIGGER update_merch_updated_at
BEFORE UPDATE ON public.merch
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.merch (name, description, price, type, image_url)
SELECT * FROM (VALUES
  ('Force Majeure Logo Print', 'Limited edition screen print of the iconic FM logo', 25.00, 'Limited Prints', '/images/fm-logo-black.png'),
  ('Vintage Poster Collection', 'Collection of vintage-style event posters', 35.00, 'Limited Prints', '/images/fm-logo-light.png'),
  ('FM Logo Sticker Pack', 'Pack of 5 vinyl stickers featuring various FM designs', 8.50, 'Stickers', '/images/fm-logo-black.png'),
  ('Holographic Sticker', 'Premium holographic sticker with rainbow effects', 12.00, 'Stickers', '/images/fm-logo-light.png')
) AS v(name, description, price, type, image_url)
WHERE NOT EXISTS (SELECT 1 FROM public.merch WHERE merch.name = v.name);