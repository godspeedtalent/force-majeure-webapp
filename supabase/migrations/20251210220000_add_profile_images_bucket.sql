-- Migration: Add profile-images storage bucket
-- Description: Creates a storage bucket for user profile photos/avatars

-- Profile images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  1048576, -- 1MB (profile photos are compressed to max 512px on smallest dimension)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 1048576;

-- Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload own profile images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = 'avatars'
  );

-- Allow authenticated users to update their own profile images
CREATE POLICY "Users can update own profile images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = 'avatars'
  );

-- Allow authenticated users to delete their own profile images
CREATE POLICY "Users can delete own profile images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = 'avatars'
  );

-- Allow public read access to profile images (they're public URLs)
CREATE POLICY "Public can view profile images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-images');
