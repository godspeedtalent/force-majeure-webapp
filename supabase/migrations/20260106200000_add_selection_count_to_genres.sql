-- Add selection_count column to genres table
-- This tracks how often a genre is selected, used for search relevance ranking

ALTER TABLE public.genres
ADD COLUMN IF NOT EXISTS selection_count integer DEFAULT 0 NOT NULL;

-- Create index for efficient sorting by selection count
CREATE INDEX IF NOT EXISTS idx_genres_selection_count
ON public.genres (selection_count DESC);

-- Add comment for documentation
COMMENT ON COLUMN public.genres.selection_count IS 'Number of times this genre has been selected, used for search relevance';

-- Create function to increment selection count
CREATE OR REPLACE FUNCTION public.increment_genre_selection_count(genre_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.genres
  SET selection_count = selection_count + 1
  WHERE id = genre_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_genre_selection_count(uuid) TO authenticated;
