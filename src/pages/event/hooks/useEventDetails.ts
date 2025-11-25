import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/shared/api/supabase/client';
import { getImageUrl } from '@/shared/utils/imageUtils';

import { ArtistSummary, EventDetailsRecord } from '../types';

interface EventRow {
  id: string;
  title: string | null;
  start_time: string | null;
  end_time: string | null;
  venue_id?: string | null;
  description: string | null;
  venue?: {
    name: string;
  } | null;
  headliner_artist: {
    id: string;
    name: string;
    genre?: string | null;
    image_url?: string | null;
  } | null;
  event_artists: Array<{
    artist: ArtistRow;
  }>;
}

interface ArtistRow {
  id: string;
  name: string;
  genre?: string | null;
  image_url?: string | null;
}

const transformArtist = (artist: ArtistRow | null): ArtistSummary => ({
  id: artist?.id ?? undefined,
  name: artist?.name ?? 'TBA',
  genre: artist?.genre ?? 'Electronic',
  image: artist?.image_url ?? null,
});

const transformEvent = (row: EventRow): EventDetailsRecord => {
  // Extract undercard artists from event_artists junction
  const undercard = row.event_artists?.map(ea => transformArtist(ea.artist)) ?? [];
  
  // Format date from start_time
  const date = row.start_time 
    ? new Date(row.start_time).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : 'Date TBA';
  
  // Format time from start_time
  const time = row.start_time
    ? new Date(row.start_time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : 'Time TBA';

  return {
    id: row.id,
    title: row.title,
    headliner: row.headliner_artist
      ? transformArtist(row.headliner_artist)
      : { name: 'TBA', genre: 'Electronic', image: null },
    undercard,
    date,
    time,
    venue: row.venue?.name ?? 'Venue TBA',
    heroImage: getImageUrl(row.headliner_artist?.image_url ?? null),
    description: row.description ?? null,
  };
};

const fetchEventDetails = async (
  eventId: string
): Promise<EventDetailsRecord> => {
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      title,
      start_time,
      end_time,
      venue_id,
      description,
      venue:venues(name),
      headliner_artist:artists!events_headliner_id_fkey(id, name, genre, image_url),
      event_artists!left(
        artist:artists(id, name, genre, image_url)
      )
    `
    )
    .eq('id', eventId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Event not found');

  // Type assertion needed due to Supabase types being out of sync
  return transformEvent(data as any as EventRow);
};

export const useEventDetails = (eventId: string | undefined) => {
  return useQuery<EventDetailsRecord, Error>({
    queryKey: ['event-details', eventId],
    enabled: Boolean(eventId),
    queryFn: () => {
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      return fetchEventDetails(eventId);
    },
  });
};
