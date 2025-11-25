-- Add hero_image column to events table
ALTER TABLE public.events
ADD COLUMN hero_image TEXT;

COMMENT ON COLUMN public.events.hero_image IS 'URL of the primary/hero image for the event';