-- Add cover_required field to media_galleries
ALTER TABLE public.media_galleries
ADD COLUMN cover_required boolean NOT NULL DEFAULT false;

-- Add is_cover field to media_items
ALTER TABLE public.media_items
ADD COLUMN is_cover boolean NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.media_galleries.cover_required IS 'Whether this gallery requires a cover photo to be set';
COMMENT ON COLUMN public.media_items.is_cover IS 'Whether this item is the cover photo for its gallery';

-- Create a function to ensure only one cover per gallery
CREATE OR REPLACE FUNCTION public.ensure_single_gallery_cover()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  -- If setting this item as cover, unset any existing cover in the same gallery
  IF NEW.is_cover = true AND NEW.gallery_id IS NOT NULL THEN
    UPDATE media_items
    SET is_cover = false
    WHERE gallery_id = NEW.gallery_id
      AND id != NEW.id
      AND is_cover = true;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to enforce single cover per gallery
CREATE TRIGGER ensure_single_gallery_cover_trigger
BEFORE INSERT OR UPDATE ON public.media_items
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_gallery_cover();

-- Update existing artist galleries to require cover
UPDATE public.media_galleries
SET cover_required = true
WHERE slug LIKE 'artist-%';