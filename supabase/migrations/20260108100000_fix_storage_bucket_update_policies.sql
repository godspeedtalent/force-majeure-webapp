-- Migration: Fix storage bucket UPDATE policies with missing WITH CHECK clauses
-- Description: Adds WITH CHECK to all storage UPDATE policies to fix upsert operations
-- Issue: Users could not upload profile pictures because the UPDATE policy lacked WITH CHECK

-- ============================================
-- 1. Fix profile-images UPDATE policy
-- ============================================
-- The profile-images bucket UPDATE policy was missing WITH CHECK, causing
-- upsert operations to fail for regular users uploading profile pictures.

DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;

CREATE POLICY "Users can update own profile images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = 'avatars'
  )
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = 'avatars'
  );

-- ============================================
-- 2. Fix artist-images UPDATE policy
-- ============================================
-- Same issue as profile-images - missing WITH CHECK clause.

DROP POLICY IF EXISTS "Users can update their artist images" ON storage.objects;

CREATE POLICY "Users can update their artist images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'artist-images'
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id = 'artist-images'
    AND auth.uid() IS NOT NULL
  );

-- ============================================
-- 3. Fix images bucket UPDATE policy (admin/developer only)
-- ============================================
-- Same issue - missing WITH CHECK clause for admin/developer image updates.

DROP POLICY IF EXISTS "Admins and developers can update images" ON storage.objects;

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
  )
  WITH CHECK (
    bucket_id = 'images'
    AND auth.uid() IS NOT NULL
    AND (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin(auth.uid())
    )
  );

-- Note: COMMENT ON POLICY statements removed because storage.objects is owned by
-- supabase_storage_admin and regular migrations cannot add comments to it.
--
-- Policy documentation:
-- - "Users can update own profile images": Allows authenticated users to update
--   their profile images in the avatars folder. Fixed 2026-01-08 to add WITH CHECK.
-- - "Users can update their artist images": Allows authenticated users to update
--   artist images. Fixed 2026-01-08 to add WITH CHECK.
-- - "Admins and developers can update images": Allows admins and developers to
--   update images in the images bucket. Fixed 2026-01-08 to add WITH CHECK.
