import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/shared';
import { getImageUrl } from '@/shared';
import { withQueryTimeout, isQueryTimeoutError } from '@/shared';
import { diagStart, diagComplete, diagError } from '@/shared/services/initDiagnostics';

import { ArtistSummary, EventDetailsRecord, EventStatus, VenueDetails } from '../types';

interface VenueRow {
  id: string;
  name: string;
  description?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  image_url?: string | null;
  logo_url?: string | null;
  website?: string | null;
  instagram_handle?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  tiktok_handle?: string | null;
}

interface EventRow {
  id: string;
  title: string | null;
  subtitle?: string | null;
  start_time: string | null;
  end_time: string | null;
  is_after_hours?: boolean | null;
  looking_for_undercard?: boolean | null;
  no_headliner?: boolean | null;
  venue_id?: string | null;
  about_event?: string | null;
  hero_image?: string | null;
  status?: EventStatus | null;
  is_free_event?: boolean | null;
  is_rsvp_only_event?: boolean | null;
  rsvp_button_subtitle?: string | null;
  mobile_full_hero_height?: boolean | null;
  max_tickets_per_order?: number | null;
  venue?: VenueRow | null;
  headliner_artist: {
    id: string;
    name: string;
    genre?: string | null;
    image_url?: string | null;
  } | null;
  event_artists: Array<{
    artist: ArtistRow;
    set_time?: string | null;
    set_order?: number | null;
  }>;
}

interface ArtistRow {
  id: string;
  name: string;
  genre?: string | null;
  image_url?: string | null;
}

const transformArtist = (
  artist: ArtistRow | null,
  setTime?: string | null,
  setOrder?: number | null
): ArtistSummary => ({
  id: artist?.id ?? undefined,
  name: artist?.name ?? 'TBA',
  genre: artist?.genre ?? 'Electronic',
  image: artist?.image_url ?? null,
  setTime: setTime ?? null,
  setOrder: setOrder ?? null,
});

const transformVenue = (venue: VenueRow | null): VenueDetails | null => {
  if (!venue) return null;

  // Combine address lines into a single address string
  const addressParts = [venue.address_line_1, venue.address_line_2].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(', ') : null;

  return {
    id: venue.id,
    name: venue.name,
    description: venue.description ?? null,
    address,
    city: venue.city ?? null,
    state: venue.state ?? null,
    zipCode: venue.zip_code ?? null,
    image: venue.image_url ?? null,
    logo: venue.logo_url ?? null,
    website: venue.website ?? null,
    googleMapsUrl: null, // Not stored in database yet
    instagram: venue.instagram_handle ?? null,
    facebook: venue.facebook_url ?? null,
    youtube: venue.youtube_url ?? null,
    tiktok: venue.tiktok_handle ?? null,
  };
};

const transformEvent = (row: EventRow): EventDetailsRecord => {
  // Extract undercard artists from event_artists junction, sorted by set_order
  const sortedEventArtists = [...(row.event_artists ?? [])].sort((a, b) => {
    // Sort by set_order if available, otherwise maintain original order
    const orderA = a.set_order ?? Infinity;
    const orderB = b.set_order ?? Infinity;
    return orderA - orderB;
  });

  const undercard = sortedEventArtists.map(ea =>
    transformArtist(ea.artist, ea.set_time, ea.set_order)
  );

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

  // Format end time if available
  const endTime = row.end_time
    ? new Date(row.end_time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null;

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? null,
    headliner: row.headliner_artist
      ? transformArtist(row.headliner_artist)
      : { name: 'TBA', genre: 'Electronic', image: null },
    undercard,
    date,
    time,
    endTime,
    isAfterHours: row.is_after_hours ?? false,
    lookingForUndercard: row.looking_for_undercard ?? false,
    noHeadliner: row.no_headliner ?? false,
    venue: row.venue?.name ?? 'Venue TBA',
    venueDetails: transformVenue(row.venue ?? null),
    heroImage: getImageUrl(row.hero_image ?? row.headliner_artist?.image_url ?? null),
    description: row.about_event ?? null,
    status: row.status ?? 'published',
    isFreeEvent: row.is_free_event ?? false,
    isRsvpOnlyEvent: row.is_rsvp_only_event ?? false,
    rsvpButtonSubtitle: row.rsvp_button_subtitle ?? null,
    mobileFullHeroHeight: row.mobile_full_hero_height ?? false,
    maxTicketsPerOrder: row.max_tickets_per_order ?? 100, // Default to 100 if not set
  };
};

const fetchEventDetails = async (
  eventId: string
): Promise<EventDetailsRecord> => {
  const diagKey = `query.eventDetails.${eventId}`;
  diagStart(diagKey, { eventId });

  try {
    // Create the query promise - executes when awaited
    const queryPromise = supabase
      .from('events')
      .select(
        `
        id,
        title,
        subtitle,
        start_time,
        end_time,
        is_after_hours,
        looking_for_undercard,
        no_headliner,
        venue_id,
        about_event,
        hero_image,
        status,
        is_free_event,
        is_rsvp_only_event,
        rsvp_button_subtitle,
        mobile_full_hero_height,
        max_tickets_per_order,
        venue:venues(id, name, description, address_line_1, address_line_2, city, state, zip_code, image_url, logo_url, website, instagram_handle, facebook_url, youtube_url, tiktok_handle),
        headliner_artist:artists!events_headliner_id_fkey(id, name, genre, image_url),
        event_artists!left(
          set_time,
          set_order,
          artist:artists(id, name, genre, image_url)
        )
      `
      )
      .eq('id', eventId)
      .maybeSingle();

    // Wrap query in timeout to prevent indefinite hangs (10 second timeout)
    const { data, error } = await withQueryTimeout(queryPromise, 'eventDetails');

    if (error) {
      diagError(diagKey, error, { eventId });
      throw error;
    }
    if (!data) {
      const notFoundError = new Error('Event not found');
      diagError(diagKey, notFoundError, { eventId });
      throw notFoundError;
    }

    // Type assertion needed due to Supabase types being out of sync
    const result = transformEvent(data as unknown as EventRow);
    diagComplete(diagKey, { eventId, found: true });
    return result;
  } catch (err) {
    // Only call diagError if we haven't already (for unexpected errors)
    if (!(err instanceof Error && (err.message === 'Event not found' || 'code' in err))) {
      diagError(diagKey, err, { eventId });
    }
    throw err;
  }
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
    // Don't retry on timeout errors - if the connection is hanging, retries won't help
    // For other errors (network glitches), allow 1 retry
    retry: (failureCount, error) => {
      if (isQueryTimeoutError(error)) {
        return false; // No retries for timeouts
      }
      return failureCount < 1; // One retry for other errors
    },
  });
};
