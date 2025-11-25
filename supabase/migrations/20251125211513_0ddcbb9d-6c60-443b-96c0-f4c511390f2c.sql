-- Add focal point and view count visibility to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS hero_image_focal_x integer DEFAULT 50 CHECK (hero_image_focal_x >= 0 AND hero_image_focal_x <= 100),
ADD COLUMN IF NOT EXISTS hero_image_focal_y integer DEFAULT 50 CHECK (hero_image_focal_y >= 0 AND hero_image_focal_y <= 100),
ADD COLUMN IF NOT EXISTS show_view_count boolean DEFAULT true;

COMMENT ON COLUMN public.events.hero_image_focal_x IS 'Horizontal focal point percentage (0-100) for mobile hero image display';
COMMENT ON COLUMN public.events.hero_image_focal_y IS 'Vertical focal point percentage (0-100) for mobile hero image display';
COMMENT ON COLUMN public.events.show_view_count IS 'Whether to display view count on event details page';