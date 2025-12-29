-- Add social link columns to artists table
ALTER TABLE public.artists
ADD COLUMN instagram_handle text,
ADD COLUMN tiktok_handle text;

-- Add comment for clarity
COMMENT ON COLUMN public.artists.instagram_handle IS 'Instagram handle for the artist';
COMMENT ON COLUMN public.artists.tiktok_handle IS 'TikTok handle for the artist';