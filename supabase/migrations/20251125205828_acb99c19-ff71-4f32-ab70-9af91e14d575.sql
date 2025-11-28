-- Add hero_image column to events table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'events'
    AND column_name = 'hero_image'
  ) THEN
    ALTER TABLE public.events
    ADD COLUMN hero_image TEXT;
  END IF;
END $$;

COMMENT ON COLUMN public.events.hero_image IS 'URL of the primary/hero image for the event';