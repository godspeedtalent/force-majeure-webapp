-- Direct insert of missing press images for NHI artist (production only)
-- Only insert if the gallery exists (this is production-specific data)
INSERT INTO media_items (gallery_id, file_path, media_type, is_cover, display_order, is_active)
SELECT
  '1e7a298f-33bf-4dde-bcaf-252b770bde39',
  unnest(ARRAY[
    'https://orgxcrnnecblhuxjfruy.supabase.co/storage/v1/object/public/artist-images/registrations/1767054952869-yrruwu.jpg',
    'https://orgxcrnnecblhuxjfruy.supabase.co/storage/v1/object/public/artist-images/registrations/1767054962458-p1cold.jpg',
    'https://i.scdn.co/image/ab6761610000e5ebd97f2384b7e5b0003fd2798d'
  ]),
  'image',
  false,
  generate_series(1, 3),
  true
WHERE EXISTS (SELECT 1 FROM media_galleries WHERE id = '1e7a298f-33bf-4dde-bcaf-252b770bde39')
ON CONFLICT DO NOTHING;
