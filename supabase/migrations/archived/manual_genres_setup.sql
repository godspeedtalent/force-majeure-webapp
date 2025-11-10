-- ========================================
-- MANUAL GENRE SETUP SCRIPT
-- ========================================
-- Run this script in Supabase Dashboard > SQL Editor
-- This combines both genre migrations into one script
-- that can be run safely even if parts already exist

-- ========================================
-- PART 1: Create Genres Table
-- ========================================

-- Create genres table
CREATE TABLE IF NOT EXISTS public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES public.genres(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on genres table
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view genres" ON public.genres;
DROP POLICY IF EXISTS "Admins and developers can manage genres" ON public.genres;

-- Anyone can view genres
CREATE POLICY "Anyone can view genres"
ON public.genres
FOR SELECT
USING (true);

-- Only admins and developers can manage genres
CREATE POLICY "Admins and developers can manage genres"
ON public.genres
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::text)
  OR has_role(auth.uid(), 'developer'::text)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_genres_name ON public.genres(name);
CREATE INDEX IF NOT EXISTS idx_genres_parent_id ON public.genres(parent_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_genres_updated_at ON public.genres;
CREATE TRIGGER update_genres_updated_at
BEFORE UPDATE ON public.genres
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert all genres with hierarchy (only if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.genres LIMIT 1) THEN
    -- First, insert all top-level genres (no parent)
    INSERT INTO public.genres (name, parent_id) VALUES ('Electronic', NULL);

    -- Insert second-level genres (direct children of Electronic)
    INSERT INTO public.genres (name, parent_id)
    SELECT name, (SELECT id FROM public.genres WHERE name = parent_name)
    FROM (VALUES
      ('House', 'Electronic'), ('Techno', 'Electronic'), ('Trance', 'Electronic'),
      ('Drum & Bass', 'Electronic'), ('Dubstep', 'Electronic'), ('Ambient', 'Electronic'),
      ('Downtempo', 'Electronic'), ('Breakbeat', 'Electronic'), ('Hard Dance', 'Electronic'),
      ('Bass Music', 'Electronic'), ('Industrial', 'Electronic'), ('Electronica', 'Electronic'),
      ('Synthwave', 'Electronic'), ('IDM', 'Electronic'), ('Electro', 'Electronic'),
      ('Noise', 'Electronic'), ('Disco', 'Electronic'), ('Garage', 'Electronic'),
      ('Jersey Club', 'Electronic'), ('Footwork', 'Electronic'), ('Vaporwave', 'Electronic'),
      ('Hyperpop', 'Electronic'), ('Experimental Electronic', 'Electronic')
    ) AS t(name, parent_name);

    -- Insert all subgenres (continues with full genre list from original migration)
    -- House subgenres
    INSERT INTO public.genres (name, parent_id)
    SELECT name, (SELECT id FROM public.genres WHERE name = parent_name)
    FROM (VALUES
      ('Deep House', 'House'), ('Tech House', 'House'), ('Progressive House', 'House'),
      ('Electro House', 'House'), ('Big Room House', 'House'), ('Bass House', 'House'),
      ('Future House', 'House'), ('Tropical House', 'House'), ('Melodic House', 'House'),
      ('Minimal House', 'House'), ('Chicago House', 'House'), ('Detroit House', 'House'),
      ('Funky House', 'House'), ('Soulful House', 'House'), ('Jackin House', 'House'),
      ('Acid House', 'House'), ('Tribal House', 'House'), ('Latin House', 'House'),
      ('Afro House', 'House'), ('French House', 'House'), ('Blog House', 'House'),
      ('Future Rave', 'House'), ('Disco House', 'House'), ('Organic House', 'House'),
      ('Fidget House', 'House'), ('Ghetto House', 'House'), ('Slap House', 'House'),
      ('Brazilian Bass', 'House'), ('Ambient House', 'House'), ('Moombahton', 'House'),
      ('Amapiano', 'Afro House'), ('Afro Tech', 'Afro House'), ('Gqom', 'Afro House'),
      ('Kwaito', 'Afro House'), ('Moombahcore', 'Moombahton'),
      ('Guaracha (EDM)', 'Latin House')
    ) AS t(name, parent_name);

    -- Techno subgenres
    INSERT INTO public.genres (name, parent_id)
    SELECT name, (SELECT id FROM public.genres WHERE name = parent_name)
    FROM (VALUES
      ('Hard Techno', 'Techno'), ('Melodic Techno', 'Techno'), ('Minimal Techno', 'Techno'),
      ('Industrial Techno', 'Techno'), ('Dub Techno', 'Techno'), ('Ambient Techno', 'Techno'),
      ('Peak Time Techno', 'Techno'), ('Schranz', 'Techno'), ('Ghettotech', 'Techno'),
      ('Acid Techno', 'Techno'), ('Detroit Techno', 'Techno'), ('Berlin Techno', 'Techno'),
      ('Trance Techno', 'Techno'), ('Hardgroove Techno', 'Techno')
    ) AS t(name, parent_name);

    -- Trance and subgenres
    INSERT INTO public.genres (name, parent_id)
    SELECT name, (SELECT id FROM public.genres WHERE name = parent_name)
    FROM (VALUES
      ('Progressive Trance', 'Trance'), ('Uplifting Trance', 'Trance'),
      ('Vocal Trance', 'Trance'), ('Tech Trance', 'Trance'),
      ('Psychedelic Trance', 'Trance'), ('Hard Trance', 'Trance'),
      ('Acid Trance', 'Trance'), ('Euro-Trance', 'Trance'),
      ('Goa Trance', 'Psychedelic Trance'), ('Full-On Psytrance', 'Psychedelic Trance'),
      ('Progressive Psytrance', 'Psychedelic Trance'), ('Minimal Psytrance', 'Psychedelic Trance'),
      ('Dark Psytrance', 'Psychedelic Trance'), ('Suomisaundi', 'Psychedelic Trance'),
      ('Hard Psy', 'Psychedelic Trance'), ('Zenonesque', 'Psychedelic Trance'),
      ('Forest Psy', 'Psychedelic Trance'), ('Hi-Tech Psy', 'Psychedelic Trance')
    ) AS t(name, parent_name);

    -- Hard Dance and subgenres
    INSERT INTO public.genres (name, parent_id)
    SELECT name, (SELECT id FROM public.genres WHERE name = parent_name)
    FROM (VALUES
      ('Hardstyle', 'Hard Dance'), ('Hardcore', 'Hard Dance'), ('Makina', 'Hard Dance'),
      ('Hardbass', 'Hard Dance'), ('Hard NRG', 'Hard Dance'), ('Jumpstyle', 'Hard Dance'),
      ('Hands Up', 'Hard Dance'), ('Euphoric Hardstyle', 'Hardstyle'), ('Rawstyle', 'Hardstyle'),
      ('Dutch Hardcore', 'Hardcore'), ('Early Hardcore', 'Hardcore'),
      ('Mainstream Hardcore', 'Hardcore'), ('Happy Hardcore', 'Hardcore'),
      ('UK Hardcore', 'Hardcore'), ('Frenchcore', 'Hardcore'), ('Speedcore', 'Hardcore'),
      ('Freeform Hardcore', 'Hardcore'), ('Industrial Hardcore', 'Hardcore'),
      ('Terrorcore', 'Speedcore')
    ) AS t(name, parent_name);

    -- Drum & Bass and subgenres
    INSERT INTO public.genres (name, parent_id)
    SELECT name, (SELECT id FROM public.genres WHERE name = parent_name)
    FROM (VALUES
      ('Jungle', 'Drum & Bass'), ('Liquid Drum & Bass', 'Drum & Bass'),
      ('Neurofunk', 'Drum & Bass'), ('Jump-Up Drum & Bass', 'Drum & Bass'),
      ('Techstep', 'Drum & Bass'), ('Darkstep', 'Drum & Bass'),
      ('Atmospheric Drum & Bass', 'Drum & Bass'), ('Drumstep', 'Drum & Bass'),
      ('Halftime', 'Drum & Bass'), ('Ragga Jungle', 'Jungle')
    ) AS t(name, parent_name);

    -- Bass Music and subgenres
    INSERT INTO public.genres (name, parent_id)
    SELECT name, (SELECT id FROM public.genres WHERE name = parent_name)
    FROM (VALUES
      ('UK Bass', 'Bass Music'), ('Trap (EDM)', 'Bass Music'), ('Phonk', 'Bass Music'),
      ('Drill (UK)', 'Bass Music'), ('Midtempo Bass', 'Bass Music'), ('Latin Bass', 'Bass Music'),
      ('Jungle Terror', 'Bass Music'), ('Wave', 'Bass Music'),
      ('Baile Funk', 'Bass Music'), ('Regional Bass', 'Bass Music'),
      ('Festival Trap', 'Trap (EDM)'), ('Hybrid Trap', 'Trap (EDM)'),
      ('Drift Phonk', 'Phonk')
    ) AS t(name, parent_name);

    -- Dubstep and subgenres
    INSERT INTO public.genres (name, parent_id)
    SELECT name, (SELECT id FROM public.genres WHERE name = parent_name)
    FROM (VALUES
      ('Riddim', 'Dubstep'), ('Brostep', 'Dubstep'), ('Chillstep', 'Dubstep'),
      ('Melodic Dubstep', 'Dubstep'), ('Post-Dubstep', 'Dubstep'), ('Trapstep', 'Dubstep')
    ) AS t(name, parent_name);

    -- Garage and subgenres
    INSERT INTO public.genres (name, parent_id)
    SELECT name, (SELECT id FROM public.genres WHERE name = parent_name)
    FROM (VALUES
      ('UK Garage', 'Garage'), ('2-Step', 'UK Garage'), ('Speed Garage', 'UK Garage'),
      ('Bassline', 'UK Garage'), ('Future Garage', 'UK Garage'), ('UK Funky', 'UK Garage'),
      ('Grime', 'UK Garage')
    ) AS t(name, parent_name);

    -- Breakbeat and subgenres
    INSERT INTO public.genres (name, parent_id)
    SELECT name, (SELECT id FROM public.genres WHERE name = parent_name)
    FROM (VALUES
      ('Breakbeat Hardcore', 'Breakbeat'), ('Big Beat', 'Breakbeat'),
      ('Nu Skool Breaks', 'Breakbeat'), ('Breakcore', 'Breakbeat'),
      ('Jungle Breaks', 'Breakbeat'), ('Raggacore', 'Breakcore')
    ) AS t(name, parent_name);

    -- Other Electronic subgenres
    INSERT INTO public.genres (name, parent_id)
    SELECT name, (SELECT id FROM public.genres WHERE name = parent_name)
    FROM (VALUES
      ('Juke', 'Footwork'), ('Baltimore Club', 'Jersey Club'),
      ('Deconstructed Club', 'Experimental Electronic'),
      ('Electroacoustic', 'Experimental Electronic'),
      ('Trip Hop', 'Downtempo'), ('Chillout', 'Downtempo'),
      ('Psybient', 'Ambient'), ('Dark Ambient', 'Ambient'), ('Ambient Dub', 'Ambient'),
      ('Space Ambient', 'Ambient'), ('Drone', 'Ambient'),
      ('Glitch', 'IDM'), ('Glitch Hop', 'Glitch'), ('Wonky', 'Glitch'),
      ('Electro-Industrial', 'Industrial'), ('EBM', 'Industrial'), ('New Beat', 'Industrial'),
      ('Futurepop', 'EBM'),
      ('Witch House', 'Electronic'), ('Darkwave', 'Electronic'), ('Coldwave', 'Electronic'),
      ('Chillwave', 'Electronic'), ('Livetronica', 'Electronic'),
      ('Folktronica', 'Electronic'), ('Nu Jazz', 'Electronic'),
      ('Jazztronica', 'Nu Jazz'),
      ('Darksynth', 'Synthwave'), ('Retrowave', 'Synthwave'),
      ('Power Noise', 'Noise'),
      ('Nu-Disco', 'Disco'), ('Space Disco', 'Disco'), ('Italo Disco', 'Disco'),
      ('Hi-NRG', 'Disco'), ('Eurobeat', 'Disco'),
      ('Future Funk', 'Vaporwave'), ('Hardvapour', 'Vaporwave'), ('Mallsoft', 'Vaporwave'),
      ('Signalwave', 'Vaporwave'), ('Plunderphonics', 'Vaporwave')
    ) AS t(name, parent_name);

  END IF;
END $$;

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_genre_hierarchy(genre_id_param UUID)
RETURNS TABLE (id UUID, name TEXT, level INTEGER) AS $$
WITH RECURSIVE genre_tree AS (
  SELECT g.id, g.name, g.parent_id, 0 as level
  FROM public.genres g WHERE g.id = genre_id_param
  UNION ALL
  SELECT g.id, g.name, g.parent_id, gt.level + 1
  FROM public.genres g INNER JOIN genre_tree gt ON g.parent_id = gt.id
)
SELECT genre_tree.id, genre_tree.name, genre_tree.level
FROM genre_tree ORDER BY level, name;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.get_genre_path(genre_id_param UUID)
RETURNS TEXT AS $$
WITH RECURSIVE genre_path AS (
  SELECT g.id, g.name, g.parent_id, g.name as path
  FROM public.genres g WHERE g.id = genre_id_param
  UNION ALL
  SELECT g.id, g.name, g.parent_id, g.name || ' > ' || gp.path
  FROM public.genres g INNER JOIN genre_path gp ON g.id = gp.parent_id
)
SELECT path FROM genre_path WHERE parent_id IS NULL;
$$ LANGUAGE sql STABLE;

-- ========================================
-- PART 2: Artist-Genre Relationships
-- ========================================

-- Create junction table
CREATE TABLE IF NOT EXISTS public.artist_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, genre_id)
);

-- Enable RLS
ALTER TABLE public.artist_genres ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view artist genres" ON public.artist_genres;
DROP POLICY IF EXISTS "Admins and developers can manage artist genres" ON public.artist_genres;

CREATE POLICY "Anyone can view artist genres" ON public.artist_genres FOR SELECT USING (true);
CREATE POLICY "Admins and developers can manage artist genres" ON public.artist_genres
FOR ALL USING (has_role(auth.uid(), 'admin'::text) OR has_role(auth.uid(), 'developer'::text));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_artist_genres_artist_id ON public.artist_genres(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_genres_genre_id ON public.artist_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_artist_genres_primary ON public.artist_genres(artist_id, is_primary) WHERE is_primary = true;

-- Migrate existing genre data
DO $$
DECLARE artist_record RECORD; genre_id_var UUID;
BEGIN
  FOR artist_record IN SELECT id, genre FROM public.artists WHERE genre IS NOT NULL AND genre != ''
  LOOP
    SELECT id INTO genre_id_var FROM public.genres WHERE LOWER(name) = LOWER(artist_record.genre) LIMIT 1;
    IF genre_id_var IS NOT NULL THEN
      INSERT INTO public.artist_genres (artist_id, genre_id, is_primary)
      VALUES (artist_record.id, genre_id_var, true)
      ON CONFLICT (artist_id, genre_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Helper functions for artist-genre relationships
CREATE OR REPLACE FUNCTION public.get_artist_genres(artist_id_param UUID)
RETURNS TABLE (
  genre_id UUID, genre_name TEXT, is_primary BOOLEAN,
  parent_genre_id UUID, parent_genre_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.name, ag.is_primary, pg.id, pg.name
  FROM public.artist_genres ag
  JOIN public.genres g ON g.id = ag.genre_id
  LEFT JOIN public.genres pg ON pg.id = g.parent_id
  WHERE ag.artist_id = artist_id_param
  ORDER BY ag.is_primary DESC, g.name;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.get_artists_by_genre(
  genre_id_param UUID, include_subgenres BOOLEAN DEFAULT true
)
RETURNS TABLE (
  artist_id UUID, artist_name TEXT, artist_image_url TEXT,
  genre_name TEXT, is_primary BOOLEAN
) AS $$
BEGIN
  IF include_subgenres THEN
    RETURN QUERY
    WITH RECURSIVE genre_tree AS (
      SELECT id FROM public.genres WHERE id = genre_id_param
      UNION ALL
      SELECT g.id FROM public.genres g INNER JOIN genre_tree gt ON g.parent_id = gt.id
    )
    SELECT DISTINCT a.id, a.name, a.image_url, g.name, ag.is_primary
    FROM public.artists a
    JOIN public.artist_genres ag ON ag.artist_id = a.id
    JOIN public.genres g ON g.id = ag.genre_id
    WHERE g.id IN (SELECT id FROM genre_tree)
    ORDER BY ag.is_primary DESC, a.name;
  ELSE
    RETURN QUERY
    SELECT a.id, a.name, a.image_url, g.name, ag.is_primary
    FROM public.artists a
    JOIN public.artist_genres ag ON ag.artist_id = a.id
    JOIN public.genres g ON g.id = ag.genre_id
    WHERE g.id = genre_id_param
    ORDER BY ag.is_primary DESC, a.name;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Show summary
SELECT 'Setup Complete!' as status;
SELECT 'Total genres:' as info, COUNT(*) as count FROM public.genres;
SELECT 'Artist-genre relationships:' as info, COUNT(*) as count FROM public.artist_genres;
