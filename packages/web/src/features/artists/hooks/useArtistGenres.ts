/**
 * Artist-Genre Relationship Hooks
 *
 * React hooks for managing artist-genre relationships with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { GenreSelection } from '../types';
import * as artistService from '../services/artistService';

// ========================================
// Query Keys
// ========================================

export const artistGenreKeys = {
  all: ['artist-genres'] as const,
  byArtist: (artistId: string) => [...artistGenreKeys.all, 'artist', artistId] as const,
  byGenre: (genreId: string, includeSubgenres: boolean) =>
    [...artistGenreKeys.all, 'genre', genreId, includeSubgenres] as const,
};

// ========================================
// Query Hooks
// ========================================

/**
 * Get all genres for an artist
 */
export function useArtistGenres(artistId: string | null | undefined) {
  return useQuery({
    queryKey: artistId
      ? artistGenreKeys.byArtist(artistId)
      : ['artist-genres', 'null'],
    queryFn: () => (artistId ? artistService.getArtistGenres(artistId) : []),
    enabled: !!artistId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get artist with all genre information
 */
export function useArtistWithGenres(artistId: string | null | undefined) {
  return useQuery({
    queryKey: artistId ? ['artists', 'detail', artistId, 'with-genres'] : ['artists', 'null'],
    queryFn: () => (artistId ? artistService.getArtistWithGenres(artistId) : null),
    enabled: !!artistId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get artists by genre
 */
export function useArtistsByGenre(
  genreId: string | null | undefined,
  includeSubgenres: boolean = true,
  limit: number = 50
) {
  return useQuery({
    queryKey: genreId
      ? artistGenreKeys.byGenre(genreId, includeSubgenres)
      : ['artists', 'by-genre', 'null'],
    queryFn: () =>
      genreId ? artistService.getArtistsByGenre(genreId, includeSubgenres, limit) : [],
    enabled: !!genreId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Search artists with optional genre filter
 */
export function useArtistSearch(query: string, genreFilter?: string, limit: number = 20) {
  return useQuery({
    queryKey: ['artists', 'search', query, genreFilter, limit],
    queryFn: () => artistService.searchArtists(query, genreFilter, limit),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes for search results
  });
}

// ========================================
// Mutation Hooks
// ========================================

/**
 * Add a genre to an artist
 */
export function useAddGenreToArtist() {
  const { t } = useTranslation('toasts');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      artistId,
      genreId,
      isPrimary = false,
    }: {
      artistId: string;
      genreId: string;
      isPrimary?: boolean;
    }) => artistService.addGenreToArtist(artistId, genreId, isPrimary),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: artistGenreKeys.byArtist(variables.artistId),
      });
      queryClient.invalidateQueries({
        queryKey: ['artists', 'detail', variables.artistId],
      });
      toast.success(t('artists.genreAdded'));
    },
    onError: (error: Error) => {
      toast.error(`${t('artists.genreAddFailed')}: ${error.message}`);
    },
  });
}

/**
 * Remove a genre from an artist
 */
export function useRemoveGenreFromArtist() {
  const { t } = useTranslation('toasts');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ artistId, genreId }: { artistId: string; genreId: string }) =>
      artistService.removeGenreFromArtist(artistId, genreId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: artistGenreKeys.byArtist(variables.artistId),
      });
      queryClient.invalidateQueries({
        queryKey: ['artists', 'detail', variables.artistId],
      });
      toast.success(t('artists.genreRemoved'));
    },
    onError: (error: Error) => {
      toast.error(`${t('artists.genreRemoveFailed')}: ${error.message}`);
    },
  });
}

/**
 * Set primary genre for an artist
 */
export function useSetPrimaryGenre() {
  const { t } = useTranslation('toasts');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ artistId, genreId }: { artistId: string; genreId: string }) =>
      artistService.setPrimaryGenre(artistId, genreId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: artistGenreKeys.byArtist(variables.artistId),
      });
      queryClient.invalidateQueries({
        queryKey: ['artists', 'detail', variables.artistId],
      });
      toast.success(t('artists.primaryGenreUpdated'));
    },
    onError: (error: Error) => {
      toast.error(`${t('artists.primaryGenreFailed')}: ${error.message}`);
    },
  });
}

/**
 * Update all genres for an artist (replaces existing)
 */
export function useUpdateArtistGenres() {
  const { t } = useTranslation('toasts');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      artistId,
      genreSelections,
    }: {
      artistId: string;
      genreSelections: GenreSelection[];
    }) => artistService.updateArtistGenres(artistId, genreSelections),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: artistGenreKeys.byArtist(variables.artistId),
      });
      queryClient.invalidateQueries({
        queryKey: ['artists', 'detail', variables.artistId],
      });
      toast.success(t('artists.genresUpdated'));
    },
    onError: (error: Error) => {
      toast.error(`${t('artists.genresUpdateFailed')}: ${error.message}`);
    },
  });
}

// ========================================
// Utility Hooks
// ========================================

/**
 * Get primary genre name for an artist (for display)
 */
export function useArtistPrimaryGenreName(artistId: string | null | undefined): string | null {
  const { data: genres } = useArtistGenres(artistId);

  if (!genres || genres.length === 0) {
    return null;
  }

  const primary = genres.find(g => g.isPrimary);
  return primary?.genre.name ?? genres[0]?.genre.name ?? null;
}

/**
 * Get all genre names for an artist as comma-separated string
 */
export function useArtistGenreNames(artistId: string | null | undefined): string {
  const { data: genres } = useArtistGenres(artistId);

  if (!genres || genres.length === 0) {
    return '';
  }

  return genres.map(g => g.genre.name).join(', ');
}

/**
 * Check if artist has a specific genre
 */
export function useArtistHasGenre(
  artistId: string | null | undefined,
  genreId: string | null | undefined
): boolean {
  const { data: genres } = useArtistGenres(artistId);

  if (!genres || !genreId) {
    return false;
  }

  return genres.some(g => g.genreId === genreId);
}
