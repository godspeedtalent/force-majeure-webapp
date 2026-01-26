-- Fix images bucket RLS policies for proper public access
-- The SELECT policy was missing explicit role grants (TO anon, authenticated)
-- and auth function calls weren't optimized per RLS performance guidelines

-- Drop existing policies
DROP POLICY IF EXISTS "Images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can update images" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can delete images" ON storage.objects;

-- Anyone can view images (public bucket) - explicitly grant to anon and authenticated
CREATE POLICY "Images are publicly accessible"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'images');

-- Admins and developers can upload images (optimized auth calls)
CREATE POLICY "Admins and developers can upload images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'images'
  AND (SELECT auth.uid()) IS NOT NULL
  AND (
    has_role((SELECT auth.uid()), 'admin')
    OR has_role((SELECT auth.uid()), 'developer')
    OR is_dev_admin((SELECT auth.uid()))
  )
);

-- Admins and developers can update images (optimized auth calls)
CREATE POLICY "Admins and developers can update images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'images'
  AND (SELECT auth.uid()) IS NOT NULL
  AND (
    has_role((SELECT auth.uid()), 'admin')
    OR has_role((SELECT auth.uid()), 'developer')
    OR is_dev_admin((SELECT auth.uid()))
  )
);

-- Admins and developers can delete images (optimized auth calls)
CREATE POLICY "Admins and developers can delete images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'images'
  AND (SELECT auth.uid()) IS NOT NULL
  AND (
    has_role((SELECT auth.uid()), 'admin')
    OR has_role((SELECT auth.uid()), 'developer')
    OR is_dev_admin((SELECT auth.uid()))
  )
);
