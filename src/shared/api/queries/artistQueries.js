import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { logger } from '@/shared';
// ============================================================================
// Query Keys
// ============================================================================
export const artistKeys = {
    all: ['artists'],
    lists: () => [...artistKeys.all, 'list'],
    detail: (id) => [...artistKeys.all, 'detail', id],
    search: (query) => [...artistKeys.all, 'search', query],
    byGenre: (genre) => [...artistKeys.all, 'genre', genre],
    events: (id) => [...artistKeys.all, 'events', id],
};
// ============================================================================
// Query Hooks
// ============================================================================
/**
 * Fetch a single artist by ID
 *
 * @param artistId - Artist ID
 */
export function useArtistById(artistId) {
    return useQuery({
        queryKey: artistKeys.detail(artistId || ''),
        queryFn: async () => {
            if (!artistId)
                throw new Error('Artist ID is required');
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
            return data;
        },
        enabled: Boolean(artistId),
    });
}
/**
 * Fetch all artists
 */
export function useArtists() {
    return useQuery({
        queryKey: artistKeys.lists(),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('artists')
                .select('id, name, bio, image_url, spotify_id, website, genre')
                .order('name', { ascending: true });
            if (error) {
                logger.error('Error fetching artists', {
                    error: error.message,
                    source: 'artistQueries',
                });
                throw error;
            }
            return (data || []);
        },
    });
}
/**
 * Search artists by name
 *
 * @param query - Search query
 */
export function useSearchArtists(query) {
    return useQuery({
        queryKey: artistKeys.search(query),
        queryFn: async () => {
            if (!query)
                return [];
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
            return (data || []);
        },
        enabled: query.length > 0,
    });
}
/**
 * Fetch artists by genre
 *
 * @param genre - Genre name
 */
export function useArtistsByGenre(genre) {
    return useQuery({
        queryKey: artistKeys.byGenre(genre || ''),
        queryFn: async () => {
            if (!genre)
                return [];
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
            return (data || []);
        },
        enabled: Boolean(genre),
    });
}
/**
 * Fetch upcoming events for an artist
 *
 * @param artistId - Artist ID
 */
export function useArtistEvents(artistId) {
    return useQuery({
        queryKey: artistKeys.events(artistId || ''),
        queryFn: async () => {
            if (!artistId)
                return [];
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
    return useMutation({
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
            return data;
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
    return useMutation({
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
            return result;
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
    return useMutation({
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
