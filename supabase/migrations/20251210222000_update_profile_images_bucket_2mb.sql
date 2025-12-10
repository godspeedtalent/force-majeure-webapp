-- Migration: Update profile-images bucket size limit to 2MB
-- Description: Increases file size limit to 2MB for profile photos (1080px min dimension)

UPDATE storage.buckets
SET file_size_limit = 2097152  -- 2MB
WHERE id = 'profile-images';
