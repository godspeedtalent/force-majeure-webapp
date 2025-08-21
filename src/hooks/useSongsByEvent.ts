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
        // Get the event with headliner and undercard artist IDs
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('headliner_id, undercard_ids')
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;

        if (!eventData) {
          setSongs([]);
          return;
        }

        // Collect all artist IDs
        const artistIds: string[] = [];
        
        // Add headliner artist
        if (eventData.headliner_id) {
          artistIds.push(eventData.headliner_id);
        }
        
        // Add undercard artists
        if (eventData.undercard_ids && Array.isArray(eventData.undercard_ids)) {
          artistIds.push(...eventData.undercard_ids);
        }

        if (artistIds.length === 0) {
          setSongs([]);
          return;
        }

        // Fetch songs for these artists
        const { data: songsData, error: songsError } = await supabase
          .from('songs')
          .select(`
            *,
            artists(name)
          `)
          .in('artist_id', artistIds)
          .eq('is_preview', true);

        if (songsError) throw songsError;

        // Transform songs to include artist names
        const songsWithArtists: Song[] = (songsData || []).map(song => {
          return {
            id: song.id,
            song_name: song.song_name,
            artist_id: song.artist_id,
            artist_name: song.artists?.name || 'Unknown Artist',
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