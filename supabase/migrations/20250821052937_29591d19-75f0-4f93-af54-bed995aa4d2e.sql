-- Add missing artists for Ninajirachi event
INSERT INTO public.artists (name) VALUES 
  ('45AM'),
  ('Syzy'),
  ('MEA CULPA')
ON CONFLICT (name) DO NOTHING;

-- Add songs for each artist
-- First, get the artist IDs and insert songs
WITH artist_lookup AS (
  SELECT id, name FROM public.artists WHERE name IN ('45AM', 'Ninajirachi', 'Syzy', 'MEA CULPA')
)
INSERT INTO public.songs (song_name, artist_id, streaming_link, music_source, is_preview)
SELECT 
  CASE 
    WHEN al.name = '45AM' THEN 'Track from 45AM'
    WHEN al.name = 'Ninajirachi' THEN 'Track from Ninajirachi'
    WHEN al.name = 'Syzy' THEN 'Track from Syzy'
    WHEN al.name = 'MEA CULPA' THEN 'Track from MEA CULPA'
  END as song_name,
  al.id as artist_id,
  CASE 
    WHEN al.name = '45AM' THEN 'https://open.spotify.com/track/0mL7GYy0o9BMPINEAiCJeD?si=50fe5e06ac724a88'
    WHEN al.name = 'Ninajirachi' THEN 'https://open.spotify.com/track/1xqT27jSG1Y15vOXfsV0gv?si=2b945ea274db4e55'
    WHEN al.name = 'Syzy' THEN 'https://open.spotify.com/track/6SRDN6AyatafwXnJh6KI1n?si=ef8b5bf851164a18'
    WHEN al.name = 'MEA CULPA' THEN 'https://open.spotify.com/track/7uwABjpWC2RjUK4qCx6rFC?si=54695bd0b567487e'
  END as streaming_link,
  'spotify' as music_source,
  true as is_preview
FROM artist_lookup al;

-- Update the event to include the new artists as undercard
UPDATE public.events 
SET undercard_ids = (
  SELECT ARRAY_AGG(id) 
  FROM public.artists 
  WHERE name IN ('45AM', 'Syzy', 'MEA CULPA')
)
WHERE id = '518a31c7-01c6-47eb-b6d6-ad2ce7b7114e';