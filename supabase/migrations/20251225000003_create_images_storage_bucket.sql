-- Create images storage bucket for media galleries
-- This bucket stores images uploaded via the gallery management system

-- Create the bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can update images" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can delete images" ON storage.objects;

-- RLS Policies for images bucket

-- Anyone can view images (public bucket)
CREATE POLICY "Images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'images');

-- Admins and developers can upload images
CREATE POLICY "Admins and developers can upload images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'images'
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
    OR is_dev_admin(auth.uid())
  )
);

-- Admins and developers can update images
CREATE POLICY "Admins and developers can update images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'images'
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
    OR is_dev_admin(auth.uid())
  )
);

-- Admins and developers can delete images
CREATE POLICY "Admins and developers can delete images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'images'
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
    OR is_dev_admin(auth.uid())
  )
);
