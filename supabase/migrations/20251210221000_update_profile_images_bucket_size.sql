-- Migration: Update profile-images bucket size limit
-- Description: Increases file size limit to 1MB for profile photos

UPDATE storage.buckets
SET file_size_limit = 1048576  -- 1MB
WHERE id = 'profile-images';
