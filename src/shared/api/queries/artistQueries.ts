import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { logger } from '@/shared';
import type { Artist } from '@/features/events/types';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined): value is string {
  return Boolean(value && UUID_REGEX.test(value));
}

/**
 * Artist Queries
 *
 * Centralized React Query hooks for all artist-related data operations.
 * Eliminates duplicate query definitions across components.
 *
 * Usage:
 * ```ts
 * const { data: artist } = useArtistById(artistId);
 * const { data: artists } = useArtists();
 * const createMutation = useCreateArtist();
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export interface ArtistGenreRelation {
  genre_id: string;
  is_primary: boolean | null;
  genres: { id: string; name: string } | null;
}

export interface ArtistRecording {
  id: string;
  name: string;
  url: string;
  cover_art: string | null;
  platform: string;
  is_primary_dj_set: boolean;
}

export interface ArtistWithDetails extends Artist {
  test_data?: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
  gallery_id?: string | null;
  artist_genres?: ArtistGenreRelation[];
  artist_recordings?: ArtistRecording[];
}

export interface CreateArtistData {
  name: string;
  bio?: string | null;
  /** @deprecated Use gallery_id instead - images should be uploaded to the artist's gallery */
  image_url?: string | null;
  gallery_id?: string | null;
  genre?: string | null;
  website?: string | null;
  spotify_id?: string | null;
  website_url?: string | null;
}

// ============================================================================
// Query Keys
// ============================================================================

export const artistKeys = {
  all: ['artists'] as const,
  lists: () => [...artistKeys.all, 'list'] as const,
  detail: (id: string) => [...artistKeys.all, 'detail', id] as const,
  search: (query: string) => [...artistKeys.all, 'search', query] as const,
  byGenre: (genre: string) => [...artistKeys.all, 'genre', genre] as const,
  events: (id: string) => [...artistKeys.all, 'events', id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch a single artist by ID
 *
 * @param artistId - Artist ID
 */
export function useArtistById(artistId: string | undefined) {
  return useQuery<ArtistWithDetails | null, Error>({
    queryKey: artistKeys.detail(artistId || ''),
    queryFn: async () => {
      if (!isUuid(artistId)) return null;

      const { data, error } = await supabase
        .from('artists')
        .select(`
          *,
          artist_genres(
            genre_id,
            is_primary,
            genres:genres(id, name)
          ),
          artist_recordings(
            id, name, url, cover_art, platform, is_primary_dj_set
          )
        `)
        .eq('id', artistId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error('Error fetching artist by ID', {
          error: error.message,
          source: 'artistQueries',
          artistId,
        });
        throw error;
      }

      return data as ArtistWithDetails;
    },
    enabled: isUuid(artistId),
  });
}

/**
 * Fetch all artists
 */
export function useArtists() {
  return useQuery<Artist[], Error>({
    queryKey: artistKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, bio, gallery_id, spotify_id, website, genre')
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching artists', {
          error: error.message,
          source: 'artistQueries',
        });
        throw error;
      }

      return (data || []) as unknown as Artist[];
    },
  });
}

/**
 * Search artists by name
 *
 * @param query - Search query
 */
export function useSearchArtists(query: string) {
  return useQuery<Artist[], Error>({
    queryKey: artistKeys.search(query),
    queryFn: async () => {
      if (!query) return [];

      const { data, error } = await supabase
        .from('artists')
        .select('id, name, bio, gallery_id, genre')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(20);

      if (error) {
        logger.error('Error searching artists', {
          error: error.message,
          source: 'artistQueries',
          query,
        });
        throw error;
      }

      return (data || []) as Artist[];
    },
    enabled: query.length > 0,
  });
}

/**
 * Fetch artists by genre
 *
 * @param genre - Genre name
 */
export function useArtistsByGenre(genre: string | undefined) {
  return useQuery<Artist[], Error>({
    queryKey: artistKeys.byGenre(genre || ''),
    queryFn: async () => {
      if (!genre) return [];

      const { data, error } = await supabase
        .from('artists')
        .select('id, name, bio, gallery_id, genre')
        .eq('genre', genre)
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching artists by genre', {
          error: error.message,
          source: 'artistQueries',
          genre,
        });
        throw error;
      }

      return (data || []) as Artist[];
    },
    enabled: Boolean(genre),
  });
}

/**
 * Fetch upcoming events for an artist (headliner only)
 *
 * @param artistId - Artist ID
 */
export function useArtistEvents(artistId: string | undefined) {
  return useQuery({
    queryKey: artistKeys.events(artistId || ''),
    queryFn: async () => {
      if (!isUuid(artistId)) return [];

      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          start_time,
          hero_image,
          venues(name)
        `)
        .eq('headliner_id', artistId)
        .eq('status', 'published')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) {
        logger.error('Error fetching artist events', {
          error: error.message,
          source: 'artistQueries',
          artistId,
        });
        throw error;
      }

      return data || [];
    },
    enabled: isUuid(artistId),
  });
}

export interface ArtistEventData {
  id: string;
  title: string;
  start_time: string;
  hero_image: string | null;
  venues: { name: string } | null;
}

/**
 * Fetch all events (past and future) where the artist is in the lineup or is headliner
 *
 * @param artistId - Artist ID
 */
export function useArtistAllEvents(artistId: string | undefined) {
  return useQuery({
    queryKey: ['artist-all-events', artistId],
    queryFn: async (): Promise<{ upcoming: ArtistEventData[]; past: ArtistEventData[] }> => {
      if (!isUuid(artistId)) return { upcoming: [], past: [] };

      const now = new Date().toISOString();

      // Fetch events where artist is in the lineup
      const { data: lineupEvents, error: lineupError } = await supabase
        .from('event_artists')
        .select(`
          events!inner(
            id,
            title,
            start_time,
            hero_image,
            status,
            venues(name)
          )
        `)
        .eq('artist_id', artistId);

      if (lineupError) {
        logger.error('Error fetching lineup events', {
          error: lineupError.message,
          source: 'artistQueries',
          artistId,
        });
      }

      // Fetch events where artist is headliner
      const { data: headlinerEvents, error: headlinerError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          start_time,
          hero_image,
          status,
          venues(name)
        `)
        .eq('headliner_id', artistId);

      if (headlinerError) {
        logger.error('Error fetching headliner events', {
          error: headlinerError.message,
          source: 'artistQueries',
          artistId,
        });
      }

      // Combine and deduplicate events
      const eventMap = new Map<string, ArtistEventData>();

      // Add headliner events
      (headlinerEvents || []).forEach((event: any) => {
        if (event.status === 'published') {
          eventMap.set(event.id, {
            id: event.id,
            title: event.title,
            start_time: event.start_time,
            hero_image: event.hero_image,
            venues: event.venues,
          });
        }
      });

      // Add lineup events
      (lineupEvents || []).forEach((item: any) => {
        const event = item.events;
        if (event && event.status === 'published' && !eventMap.has(event.id)) {
          eventMap.set(event.id, {
            id: event.id,
            title: event.title,
            start_time: event.start_time,
            hero_image: event.hero_image,
            venues: event.venues,
          });
        }
      });

      // Convert to array and sort
      const allEvents = Array.from(eventMap.values());

      // Split into upcoming and past
      const upcoming = allEvents
        .filter(e => e.start_time >= now)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      const past = allEvents
        .filter(e => e.start_time < now)
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

      return { upcoming, past };
    },
    enabled: isUuid(artistId),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new artist
 *
 * Automatically invalidates artist list queries on success
 */
export function useCreateArtist() {
  const queryClient = useQueryClient();

  return useMutation<Artist, Error, CreateArtistData>({
    mutationFn: async (artistData) => {
      const { data, error } = await supabase
        .from('artists')
        .insert([artistData])
        .select()
        .single();

      if (error) {
        logger.error('Error creating artist', {
          error: error.message,
          source: 'artistQueries',
        });
        throw error;
      }

      return data as Artist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artistKeys.lists() });
    },
  });
}

/**
 * Update an artist
 *
 * Automatically invalidates artist queries on success
 */
export function useUpdateArtist() {
  const queryClient = useQueryClient();

  return useMutation<Artist, Error, { artistId: string; data: Partial<CreateArtistData> }>({
    mutationFn: async ({ artistId, data }) => {
      const { data: result, error } = await supabase
        .from('artists')
        .update(data)
        .eq('id', artistId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating artist', {
          error: error.message,
          source: 'artistQueries',
          artistId,
        });
        throw error;
      }

      return result as Artist;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: artistKeys.detail(variables.artistId) });
      queryClient.invalidateQueries({ queryKey: artistKeys.lists() });
    },
  });
}

/**
 * Delete an artist
 *
 * Automatically invalidates artist queries on success
 */
export function useDeleteArtist() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (artistId) => {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', artistId);

      if (error) {
        logger.error('Error deleting artist', {
          error: error.message,
          source: 'artistQueries',
          artistId,
        });
        throw error;
      }
    },
    onSuccess: (_, artistId) => {
      queryClient.removeQueries({ queryKey: artistKeys.detail(artistId) });
      queryClient.invalidateQueries({ queryKey: artistKeys.lists() });
    },
  });
}
