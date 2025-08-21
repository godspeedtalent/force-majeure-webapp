import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/contexts/MusicPlayerContext';

export const useSongsByEvent = (eventId: string | null) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setSongs([]);
      return;
    }

    const fetchSongs = async () => {
      setLoading(true);
      setError(null);

      try {
        // First get the artists for this event
        const { data: eventArtists, error: eventError } = await supabase
          .from('event_artists')
          .select(`
            artist_id,
            is_headliner,
            performance_order,
            artists (
              id,
              name,
              genre,
              image_url
            )
          `)
          .eq('event_id', eventId)
          .order('performance_order', { ascending: true });

        if (eventError) throw eventError;

        if (!eventArtists || eventArtists.length === 0) {
          setSongs([]);
          return;
        }

        // Get all artist IDs
        const artistIds = eventArtists.map(ea => ea.artist_id);

        // Fetch songs for these artists
        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select('*')
          .in('artist_id', artistIds)
          .eq('is_preview', true);

        if (songsError) throw songsError;

        // Transform songs to include artist names
        const songsWithArtists: Song[] = (songsData || []).map(song => {
          const eventArtist = eventArtists.find(ea => ea.artist_id === song.artist_id);
          const artist = eventArtist?.artists;

          return {
            id: song.id,
            song_name: song.song_name,
            artist_id: song.artist_id,
            artist_name: artist?.name || 'Unknown Artist',
            streaming_link: song.streaming_link,
            music_source: song.music_source as Song['music_source'],
            duration: song.duration,
            is_preview: song.is_preview,
          };
        });

        setSongs(songsWithArtists);
      } catch (err) {
        console.error('Error fetching songs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch songs');
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [eventId]);

  return { songs, loading, error };
};