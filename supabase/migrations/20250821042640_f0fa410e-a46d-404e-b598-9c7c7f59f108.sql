-- Create artists table
CREATE TABLE IF NOT EXISTS public.artists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  genre TEXT,
  bio TEXT,
  image_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on artists
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to artists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'artists'
    AND policyname = 'Artists are publicly viewable'
  ) THEN
    CREATE POLICY "Artists are publicly viewable"
    ON public.artists
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Create songs table
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_name TEXT NOT NULL,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  streaming_link TEXT NOT NULL,
  music_source TEXT NOT NULL CHECK (music_source IN ('spotify', 'soundcloud', 'youtube', 'apple_music')),
  duration INTEGER,
  is_preview BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on songs
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to songs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'songs'
    AND policyname = 'Songs are publicly viewable'
  ) THEN
    CREATE POLICY "Songs are publicly viewable"
    ON public.songs
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Create event_artists junction table
CREATE TABLE IF NOT EXISTS public.event_artists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  is_headliner BOOLEAN DEFAULT false,
  performance_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, artist_id)
);

-- Enable RLS on event_artists
ALTER TABLE public.event_artists ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to event_artists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'event_artists'
    AND policyname = 'Event artists are publicly viewable'
  ) THEN
    CREATE POLICY "Event artists are publicly viewable"
    ON public.event_artists
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Add triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_artists_updated_at ON public.artists;
CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON public.artists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_songs_updated_at ON public.songs;
CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON public.songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_event_artists_event_id ON public.event_artists(event_id);
CREATE INDEX IF NOT EXISTS idx_event_artists_artist_id ON public.event_artists(artist_id);
CREATE INDEX IF NOT EXISTS idx_artists_name ON public.artists(name);
