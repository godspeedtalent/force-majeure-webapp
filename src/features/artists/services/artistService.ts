/**
 * Artist Service
 *
 * Handles artist-related database operations including genre relationships
 */

import { supabase } from '@/shared/api/supabase/client';
import { logger } from '@/shared/services/logger';
import { logApiError, logApi } from '@/shared/utils/apiLogger';
import type {
  Artist,
  ArtistWithGenres,
  ArtistGenre,
  ArtistGenreWithDetails,
  GenreSelection,
} from '../types';

// ========================================
// Artist-Genre Relationship Operations
// ========================================

/**
 * Get all genres for an artist
 */
export async function getArtistGenres(artistId: string): Promise<ArtistGenreWithDetails[]> {
  try {
    logApi('getArtistGenres', 'Fetching artist genres', { artistId });

    const { data, error } = await supabase.rpc('get_artist_genres', {
      artist_id_param: artistId,
    });

    if (error) {
      logApiError('getArtistGenres', 'Failed to fetch artist genres', error);
      throw error;
    }

    return data.map((row: any) => ({
      id: '', // RPC doesn't return the junction table ID
      artistId,
      genreId: row.genre_id,
      isPrimary: row.is_primary,
      createdAt: new Date().toISOString(),
      genre: {
        id: row.genre_id,
        name: row.genre_name,
        parentId: row.parent_genre_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parent: row.parent_genre_id
          ? {
              id: row.parent_genre_id,
              name: row.parent_genre_name,
              parentId: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : null,
      },
    }));
  } catch (error) {
    logger.error('Failed to fetch artist genres', { error, artistId });
    throw error;
  }
}

/**
 * Get artist with all genre relationships
 */
export async function getArtistWithGenres(artistId: string): Promise<ArtistWithGenres | null> {
  try {
    logApi('getArtistWithGenres', 'Fetching artist with genres', { artistId });

    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single();

    if (artistError) {
      if (artistError.code === 'PGRST116') {
        return null;
      }
      logApiError('getArtistWithGenres', 'Failed to fetch artist', artistError);
      throw artistError;
    }

    const genres = await getArtistGenres(artistId);
    const primaryGenre = genres.find(g => g.isPrimary)?.genre ?? null;

    return {
      id: artistData.id,
      name: artistData.name,
      bio: artistData.bio,
      imageUrl: artistData.image_url,
      socialLinks: artistData.social_links as Record<string, string> | null,
      createdAt: artistData.created_at,
      updatedAt: artistData.updated_at,
      genre: artistData.genre,
      genres,
      primaryGenre,
    };
  } catch (error) {
    logger.error('Failed to fetch artist with genres', { error, artistId });
    throw error;
  }
}

/**
 * Add genre to artist
 */
export async function addGenreToArtist(
  artistId: string,
  genreId: string,
  isPrimary: boolean = false
): Promise<ArtistGenre> {
  try {
    logApi('addGenreToArtist', 'Adding genre to artist', {
      artistId,
      genreId,
      isPrimary,
    });

    // If this is being set as primary, unset any existing primary genres
    if (isPrimary) {
      await supabase
        .from('artist_genres')
        .update({ is_primary: false })
        .eq('artist_id', artistId)
        .eq('is_primary', true);
    }

    const { data, error } = await supabase
      .from('artist_genres')
      .insert({
        artist_id: artistId,
        genre_id: genreId,
        is_primary: isPrimary,
      })
      .select()
      .single();

    if (error) {
      logApiError('addGenreToArtist', 'Failed to add genre to artist', error);
      throw error;
    }

    return {
      id: data.id,
      artistId: data.artist_id,
      genreId: data.genre_id,
      isPrimary: data.is_primary,
      createdAt: data.created_at,
    };
  } catch (error) {
    logger.error('Failed to add genre to artist', { error, artistId, genreId });
    throw error;
  }
}

/**
 * Remove genre from artist
 */
export async function removeGenreFromArtist(
  artistId: string,
  genreId: string
): Promise<void> {
  try {
    logApi('removeGenreFromArtist', 'Removing genre from artist', {
      artistId,
      genreId,
    });

    const { error } = await supabase
      .from('artist_genres')
      .delete()
      .eq('artist_id', artistId)
      .eq('genre_id', genreId);

    if (error) {
      logApiError('removeGenreFromArtist', 'Failed to remove genre from artist', error);
      throw error;
    }

    logApi('removeGenreFromArtist', 'Genre removed from artist successfully');
  } catch (error) {
    logger.error('Failed to remove genre from artist', { error, artistId, genreId });
    throw error;
  }
}

/**
 * Set primary genre for artist
 */
export async function setPrimaryGenre(artistId: string, genreId: string): Promise<void> {
  try {
    logApi('setPrimaryGenre', 'Setting primary genre for artist', {
      artistId,
      genreId,
    });

    // First, unset all primary flags for this artist
    await supabase
      .from('artist_genres')
      .update({ is_primary: false })
      .eq('artist_id', artistId);

    // Then set the new primary genre
    const { error } = await supabase
      .from('artist_genres')
      .update({ is_primary: true })
      .eq('artist_id', artistId)
      .eq('genre_id', genreId);

    if (error) {
      logApiError('setPrimaryGenre', 'Failed to set primary genre', error);
      throw error;
    }

    logApi('setPrimaryGenre', 'Primary genre set successfully');
  } catch (error) {
    logger.error('Failed to set primary genre', { error, artistId, genreId });
    throw error;
  }
}

/**
 * Update all genres for an artist (replaces existing)
 */
export async function updateArtistGenres(
  artistId: string,
  genreSelections: GenreSelection[]
): Promise<void> {
  try {
    logApi('updateArtistGenres', 'Updating artist genres', {
      artistId,
      genreCount: genreSelections.length,
    });

    // Delete all existing genre relationships
    await supabase.from('artist_genres').delete().eq('artist_id', artistId);

    // Insert new relationships
    if (genreSelections.length > 0) {
      const inserts = genreSelections.map(selection => ({
        artist_id: artistId,
        genre_id: selection.genreId,
        is_primary: selection.isPrimary,
      }));

      const { error } = await supabase.from('artist_genres').insert(inserts);

      if (error) {
        logApiError('updateArtistGenres', 'Failed to update artist genres', error);
        throw error;
      }
    }

    logApi('updateArtistGenres', 'Artist genres updated successfully');
  } catch (error) {
    logger.error('Failed to update artist genres', { error, artistId });
    throw error;
  }
}

// ========================================
// Genre-based Artist Queries
// ========================================

/**
 * Get artists by genre (including subgenres)
 */
export async function getArtistsByGenre(
  genreId: string,
  includeSubgenres: boolean = true,
  limit: number = 50
): Promise<ArtistWithGenres[]> {
  try {
    logApi('getArtistsByGenre', 'Fetching artists by genre', {
      genreId,
      includeSubgenres,
      limit,
    });

    const { data, error } = await supabase.rpc('get_artists_by_genre', {
      genre_id_param: genreId,
      include_subgenres: includeSubgenres,
    });

    if (error) {
      logApiError('getArtistsByGenre', 'Failed to fetch artists by genre', error);
      throw error;
    }

    // Fetch full artist details with genres for each artist
    const artistIds = [...new Set(data.map((row: any) => row.artist_id))].slice(0, limit);

    const artists = await Promise.all(
      artistIds.map(id => getArtistWithGenres(id))
    );

    return artists.filter((a): a is ArtistWithGenres => a !== null);
  } catch (error) {
    logger.error('Failed to fetch artists by genre', { error, genreId });
    throw error;
  }
}

/**
 * Search artists by name or genre
 */
export async function searchArtists(
  query: string,
  genreFilter?: string,
  limit: number = 20
): Promise<Artist[]> {
  try {
    logApi('searchArtists', 'Searching artists', { query, genreFilter, limit });

    let dbQuery = supabase
      .from('artists')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(limit);

    const { data, error } = await dbQuery;

    if (error) {
      logApiError('searchArtists', 'Failed to search artists', error);
      throw error;
    }

    let artists = data.map(row => ({
      id: row.id,
      name: row.name,
      bio: row.bio,
      imageUrl: row.image_url,
      socialLinks: row.social_links as Record<string, string> | null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      genre: row.genre,
    }));

    // Filter by genre if specified
    if (genreFilter) {
      const artistGenres = await Promise.all(
        artists.map(async artist => ({
          artist,
          genres: await getArtistGenres(artist.id),
        }))
      );

      artists = artistGenres
        .filter(({ genres }) =>
          genres.some(g => g.genre.name.toLowerCase().includes(genreFilter.toLowerCase()))
        )
        .map(({ artist }) => artist);
    }

    return artists;
  } catch (error) {
    logger.error('Failed to search artists', { error, query, genreFilter });
    throw error;
  }
}
