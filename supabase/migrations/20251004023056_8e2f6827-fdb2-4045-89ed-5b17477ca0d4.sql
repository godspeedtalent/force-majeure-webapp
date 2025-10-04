-- Remove old test locations
DELETE FROM public.scavenger_locations 
WHERE location_name IN ('Location 1', 'Location 2', 'Location 3', 'Location 4', 'Location 5');