-- Create entity-images storage bucket for venues, artists, and other entities (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('entity-images', 'entity-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Entity images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can upload entity images" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can update entity images" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can delete entity images" ON storage.objects;

-- RLS Policies for entity-images bucket

-- Anyone can view entity images (public bucket)
CREATE POLICY "Entity images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'entity-images');

-- Admins and developers can upload entity images
CREATE POLICY "Admins and developers can upload entity images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'entity-images'
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
    OR is_dev_admin(auth.uid())
  )
);

-- Admins and developers can update entity images
CREATE POLICY "Admins and developers can update entity images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'entity-images'
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
    OR is_dev_admin(auth.uid())
  )
);

-- Admins and developers can delete entity images
CREATE POLICY "Admins and developers can delete entity images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'entity-images'
  AND auth.uid() IS NOT NULL
  AND (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
    OR is_dev_admin(auth.uid())
  )
);