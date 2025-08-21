-- Update the hero_image paths to use the uploaded artist images
UPDATE public.events 
SET hero_image = '/src/assets/lf-system-cover.jpg'
WHERE title = 'LF SYSTEM';

UPDATE public.events 
SET hero_image = '/src/assets/ninajirachi-cover.jpg'
WHERE title = 'Ninajirachi';