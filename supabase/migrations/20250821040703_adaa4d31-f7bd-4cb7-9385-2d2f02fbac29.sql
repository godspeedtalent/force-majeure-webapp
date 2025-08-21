-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Create RLS policies for the images bucket
CREATE POLICY "Images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'images');

CREATE POLICY "Anyone can upload images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Anyone can update images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'images');

-- Update events table to use storage paths instead of URLs
ALTER TABLE public.events 
ALTER COLUMN hero_image TYPE TEXT;

-- Update merch table to use storage paths instead of URLs  
ALTER TABLE public.merch 
ALTER COLUMN image_url TYPE TEXT;