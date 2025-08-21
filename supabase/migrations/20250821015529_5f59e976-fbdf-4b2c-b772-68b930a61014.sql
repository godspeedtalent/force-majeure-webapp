-- Update the hero_image paths to use local assets for the existing events
UPDATE public.events 
SET hero_image = '/src/assets/lf-system-cover.jpg'
WHERE title = 'LF SYSTEM';

UPDATE public.events 
SET hero_image = '/src/assets/ninajirachi-cover.jpg'
WHERE title = 'Ninajirachi';