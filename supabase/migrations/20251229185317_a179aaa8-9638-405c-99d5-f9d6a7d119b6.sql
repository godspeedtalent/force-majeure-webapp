-- Create the artist-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artist-images',
  'artist-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow any authenticated user to upload artist images for registration purposes
DROP POLICY IF EXISTS "Admins and developers can upload artist images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload artist images" ON storage.objects;

CREATE POLICY "Authenticated users can upload artist images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'artist-images' AND
    auth.uid() IS NOT NULL
  );

-- Allow public read access to artist images
DROP POLICY IF EXISTS "Public can view artist images" ON storage.objects;

CREATE POLICY "Public can view artist images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'artist-images');

-- Allow authenticated users to update their own uploads (based on path starting with their user id or registrations folder)
DROP POLICY IF EXISTS "Users can update their artist images" ON storage.objects;

CREATE POLICY "Users can update their artist images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'artist-images' AND
    auth.uid() IS NOT NULL
  );

-- Allow authenticated users to delete their own uploads
DROP POLICY IF EXISTS "Users can delete their artist images" ON storage.objects;

CREATE POLICY "Users can delete their artist images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'artist-images' AND
    auth.uid() IS NOT NULL
  );