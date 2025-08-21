-- Remove all mock merch data except the LF SYSTEM print
DELETE FROM public.merch 
WHERE name != 'LF SYSTEM 10.18 Limited Club Print';

-- Update the LF SYSTEM print name to Canela Deck Medium
UPDATE public.merch 
SET name = 'Canela Deck Medium'
WHERE name = 'LF SYSTEM 10.18 Limited Club Print';