import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';
import { logger } from '@/shared/services/logger';
import type { Artist } from '@/features/events/types';

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

export interface ArtistWithDetails extends Artist {
  test_data?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateArtistData {
  name: string;
  bio?: string | null;
  image_url?: string | null;
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
      if (!artistId) throw new Error('Artist ID is required');

      const { data, error } = await supabase
        .from('artists')
        .select('*')
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
    enabled: Boolean(artistId),
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
        .select('id, name, bio, image_url, spotify_id, website_url, genre')
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching artists', {
          error: error.message,
          source: 'artistQueries',
        });
        throw error;
      }

      return (data || []) as Artist[];
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
        .select('id, name, bio, image_url, genre')
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
        .select('id, name, bio, image_url, genre')
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
 * Fetch upcoming events for an artist
 *
 * @param artistId - Artist ID
 */
export function useArtistEvents(artistId: string | undefined) {
  return useQuery({
    queryKey: artistKeys.events(artistId || ''),
    queryFn: async () => {
      if (!artistId) return [];

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
    enabled: Boolean(artistId),
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
