-- Update events with hero images
UPDATE events 
SET hero_image = '/lovable-uploads/5e2b5d54-cf53-4d78-8320-c42f67db4657.png' 
WHERE title LIKE '%FSYSTEM%' OR title LIKE '%System%';

UPDATE events 
SET hero_image = '/lovable-uploads/914b86cd-fa71-4fd0-b054-8da1b784fc8c.png' 
WHERE title LIKE '%Intense%' OR title LIKE '%INTENSE%';