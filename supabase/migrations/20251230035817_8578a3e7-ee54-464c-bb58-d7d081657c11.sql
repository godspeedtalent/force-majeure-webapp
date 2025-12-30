
-- Direct insert of missing press images for NHI artist
INSERT INTO media_items (gallery_id, file_path, media_type, is_cover, display_order, is_active)
VALUES 
  ('1e7a298f-33bf-4dde-bcaf-252b770bde39', 'https://orgxcrnnecblhuxjfruy.supabase.co/storage/v1/object/public/artist-images/registrations/1767054952869-yrruwu.jpg', 'image', false, 1, true),
  ('1e7a298f-33bf-4dde-bcaf-252b770bde39', 'https://orgxcrnnecblhuxjfruy.supabase.co/storage/v1/object/public/artist-images/registrations/1767054962458-p1cold.jpg', 'image', false, 2, true),
  ('1e7a298f-33bf-4dde-bcaf-252b770bde39', 'https://i.scdn.co/image/ab6761610000e5ebd97f2384b7e5b0003fd2798d', 'image', false, 3, true)
ON CONFLICT DO NOTHING;
