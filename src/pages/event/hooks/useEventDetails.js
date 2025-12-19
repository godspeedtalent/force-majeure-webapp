import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { getImageUrl } from '@/shared';
const transformArtist = (artist, setTime, setOrder) => ({
    id: artist?.id ?? undefined,
    name: artist?.name ?? 'TBA',
    genre: artist?.genre ?? 'Electronic',
    image: artist?.image_url ?? null,
    setTime: setTime ?? null,
    setOrder: setOrder ?? null,
});
const transformVenue = (venue) => {
    if (!venue)
        return null;
    // Combine address lines into a single address string
    const addressParts = [venue.address_line_1, venue.address_line_2].filter(Boolean);
    const address = addressParts.length > 0 ? addressParts.join(', ') : null;
    return {
        id: venue.id,
        name: venue.name,
        address,
        city: venue.city ?? null,
        state: venue.state ?? null,
        zipCode: venue.zip_code ?? null,
        image: venue.image_url ?? null,
        website: venue.website ?? null,
        googleMapsUrl: null, // Not stored in database yet
    };
};
const transformEvent = (row) => {
    // Extract undercard artists from event_artists junction, sorted by set_order
    const sortedEventArtists = [...(row.event_artists ?? [])].sort((a, b) => {
        // Sort by set_order if available, otherwise maintain original order
        const orderA = a.set_order ?? Infinity;
        const orderB = b.set_order ?? Infinity;
        return orderA - orderB;
    });
    const undercard = sortedEventArtists.map(ea => transformArtist(ea.artist, ea.set_time, ea.set_order));
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
        venue: row.venue?.name ?? 'Venue TBA',
        venueDetails: transformVenue(row.venue ?? null),
        heroImage: getImageUrl(row.hero_image ?? row.headliner_artist?.image_url ?? null),
        description: row.description ?? null,
    };
};
const fetchEventDetails = async (eventId) => {
    const { data, error } = await supabase
        .from('events')
        .select(`
      id,
      title,
      subtitle,
      start_time,
      end_time,
      is_after_hours,
      looking_for_undercard,
      venue_id,
      description,
      hero_image,
      venue:venues(id, name, address_line_1, address_line_2, city, state, zip_code, image_url, website),
      headliner_artist:artists!events_headliner_id_fkey(id, name, genre, image_url),
      event_artists!left(
        set_time,
        set_order,
        artist:artists(id, name, genre, image_url)
      )
    `)
        .eq('id', eventId)
        .maybeSingle();
    if (error)
        throw error;
    if (!data)
        throw new Error('Event not found');
    // Type assertion needed due to Supabase types being out of sync
    return transformEvent(data);
};
export const useEventDetails = (eventId) => {
    return useQuery({
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
