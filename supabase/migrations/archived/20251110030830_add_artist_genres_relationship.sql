-- ========================================
-- Add Artist-Genre Relationship
-- ========================================
-- This creates a many-to-many relationship between artists and genres
-- Artists can have multiple genres and genres can apply to multiple artists

-- Create junction table for artist-genre relationships
CREATE TABLE IF NOT EXISTS public.artist_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, genre_id)
);

-- Enable RLS on artist_genres table
ALTER TABLE public.artist_genres ENABLE ROW LEVEL SECURITY;

-- Anyone can view artist-genre relationships
CREATE POLICY "Anyone can view artist genres"
ON public.artist_genres
FOR SELECT
USING (true);

-- Only admins and developers can manage artist-genre relationships
CREATE POLICY "Admins and developers can manage artist genres"
ON public.artist_genres
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::text)
  OR has_role(auth.uid(), 'developer'::text)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_artist_genres_artist_id ON public.artist_genres(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_genres_genre_id ON public.artist_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_artist_genres_primary ON public.artist_genres(artist_id, is_primary) WHERE is_primary = true;

-- Migrate existing genre data from artists table to artist_genres junction table
-- This attempts to match text genre names to the new genres table
DO $$
DECLARE
  artist_record RECORD;
  genre_id_var UUID;
BEGIN
  FOR artist_record IN
    SELECT id, genre
    FROM public.artists
    WHERE genre IS NOT NULL AND genre != ''
  LOOP
    -- Try to find matching genre in genres table (case-insensitive)
    SELECT id INTO genre_id_var
    FROM public.genres
    WHERE LOWER(name) = LOWER(artist_record.genre)
    LIMIT 1;

    -- If we found a match, create the relationship
    IF genre_id_var IS NOT NULL THEN
      INSERT INTO public.artist_genres (artist_id, genre_id, is_primary)
      VALUES (artist_record.id, genre_id_var, true)
      ON CONFLICT (artist_id, genre_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Note: We're keeping the old genre column for now for backwards compatibility
-- Once all code is migrated, we can drop it with:
-- ALTER TABLE public.artists DROP COLUMN IF EXISTS genre;

-- Helper function to get all genres for an artist
CREATE OR REPLACE FUNCTION public.get_artist_genres(artist_id_param UUID)
RETURNS TABLE (
  genre_id UUID,
  genre_name TEXT,
  is_primary BOOLEAN,
  parent_genre_id UUID,
  parent_genre_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id as genre_id,
    g.name as genre_name,
    ag.is_primary,
    pg.id as parent_genre_id,
    pg.name as parent_genre_name
  FROM public.artist_genres ag
  JOIN public.genres g ON g.id = ag.genre_id
  LEFT JOIN public.genres pg ON pg.id = g.parent_id
  WHERE ag.artist_id = artist_id_param
  ORDER BY ag.is_primary DESC, g.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get artists by genre (including subgenres)
CREATE OR REPLACE FUNCTION public.get_artists_by_genre(genre_id_param UUID, include_subgenres BOOLEAN DEFAULT true)
RETURNS TABLE (
  artist_id UUID,
  artist_name TEXT,
  artist_image_url TEXT,
  genre_name TEXT,
  is_primary BOOLEAN
) AS $$
BEGIN
  IF include_subgenres THEN
    -- Include artists with this genre or any of its subgenres
    RETURN QUERY
    WITH RECURSIVE genre_tree AS (
      -- Base case: the specified genre
      SELECT id FROM public.genres WHERE id = genre_id_param
      UNION ALL
      -- Recursive case: all child genres
      SELECT g.id
      FROM public.genres g
      INNER JOIN genre_tree gt ON g.parent_id = gt.id
    )
    SELECT DISTINCT
      a.id as artist_id,
      a.name as artist_name,
      a.image_url as artist_image_url,
      g.name as genre_name,
      ag.is_primary
    FROM public.artists a
    JOIN public.artist_genres ag ON ag.artist_id = a.id
    JOIN public.genres g ON g.id = ag.genre_id
    WHERE g.id IN (SELECT id FROM genre_tree)
    ORDER BY ag.is_primary DESC, a.name;
  ELSE
    -- Only artists with this specific genre
    RETURN QUERY
    SELECT
      a.id as artist_id,
      a.name as artist_name,
      a.image_url as artist_image_url,
      g.name as genre_name,
      ag.is_primary
    FROM public.artists a
    JOIN public.artist_genres ag ON ag.artist_id = a.id
    JOIN public.genres g ON g.id = ag.genre_id
    WHERE g.id = genre_id_param
    ORDER BY ag.is_primary DESC, a.name;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Show migration summary
SELECT 'Migration Summary:' as info;
SELECT 'Artists with genres migrated:' as info, COUNT(*) as count
FROM public.artist_genres;
SELECT 'Artists with genres in old column:' as info, COUNT(*) as count
FROM public.artists WHERE genre IS NOT NULL AND genre != '';
