-- Allow any authenticated user to upload artist images for registration purposes
DROP POLICY IF EXISTS "Admins and developers can upload artist images" ON storage.objects;

CREATE POLICY "Authenticated users can upload artist images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'artist-images' AND
    auth.uid() IS NOT NULL
  );

-- Keep the update/delete restricted to admins/developers
-- (users can upload but only admins can modify/delete)