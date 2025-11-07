import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/shared/api/supabase/client';
import { getImageUrl } from '@/shared/utils/imageUtils';

import { ArtistSummary, EventDetailsRecord } from '../types';

interface EventRow {
  id: string;
  title: string | null;
  date: string;
  time: string;
  venue_id?: string | null;
  description: string | null;
  ticket_url?: string | null;
  hero_image?: string | null;
  venue?: {
    name: string;
  } | null;
  headliner_artist: {
    id: string;
    name: string;
    genre?: string | null;
    image_url?: string | null;
  } | null;
  undercard_ids?: string[] | null;
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

const transformEvent = (
  row: EventRow,
  undercard: ArtistRow[]
): EventDetailsRecord => ({
  id: row.id,
  title: row.title,
  headliner: row.headliner_artist
    ? transformArtist(row.headliner_artist)
    : { name: 'TBA', genre: 'Electronic', image: null },
  undercard: undercard.map(transformArtist),
  date: row.date,
  time: row.time,
  venue: row.venue?.name ?? 'Venue TBA',
  heroImage: getImageUrl(row.hero_image ?? null),
  description: row.description ?? null,
  ticketUrl: row.ticket_url ?? null,
});

const fetchEventDetails = async (
  eventId: string
): Promise<EventDetailsRecord> => {
  const { data, error } = await supabase
    .from('events')
    .select(
      `
      id,
      title,
      date,
      time,
      venue_id,
      description,
      ticket_url,
      hero_image,
      undercard_ids,
      venue:venues(name),
      headliner_artist:artists!events_headliner_id_fkey(id, name, genre, image_url)
    `
    )
    .eq('id', eventId)
    .single<EventRow>();

  if (error) throw error;
  if (!data) throw new Error('Event not found');

  let undercardRows: ArtistRow[] = [];

  if (data.undercard_ids && data.undercard_ids.length > 0) {
    const { data: undercardData, error: undercardError } = await supabase
      .from('artists')
      .select('id, name, genre, image_url')
      .in('id', data.undercard_ids);

    if (undercardError) throw undercardError;
    undercardRows = undercardData ?? [];
  }

  return transformEvent(data, undercardRows);
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
