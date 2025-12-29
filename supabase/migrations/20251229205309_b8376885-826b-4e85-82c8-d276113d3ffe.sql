-- One-time backfill: Update artists with social data from approved registrations
-- Only updates NULL fields to avoid overwriting any manually set data

UPDATE artists a
SET 
  instagram_handle = COALESCE(a.instagram_handle, r.instagram_handle),
  tiktok_handle = COALESCE(a.tiktok_handle, r.tiktok_handle),
  soundcloud_id = COALESCE(a.soundcloud_id, r.soundcloud_id),
  spotify_id = COALESCE(a.spotify_id, r.spotify_id)
FROM artist_registrations r
WHERE r.status = 'approved'
  AND LOWER(TRIM(a.name)) = LOWER(TRIM(r.artist_name))
  AND (
    (a.instagram_handle IS NULL AND r.instagram_handle IS NOT NULL)
    OR (a.tiktok_handle IS NULL AND r.tiktok_handle IS NOT NULL)
    OR (a.soundcloud_id IS NULL AND r.soundcloud_id IS NOT NULL)
    OR (a.spotify_id IS NULL AND r.spotify_id IS NOT NULL)
  );