/**
 * Artist Service
 *
 * Handles artist-related database operations including genre relationships
 */

import { supabase } from '@/shared';
import { logger } from '@/shared';
import { logApiError, logApi } from '@/shared';
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
    logApi({ message: 'Fetching artist genres', details: { artistId } });

    const { data, error } = await supabase.rpc('get_artist_genres', {
      artist_id_param: artistId,
    });

    if (error) {
      logApiError({ message: 'Failed to fetch artist genres', details: error });
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
    logApi({ message: 'Fetching artist with genres', details: { artistId } });

    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single();

    if (artistError) {
      if (artistError.code === 'PGRST116') {
        return null;
      }
      logApiError({ message: 'Failed to fetch artist', details: artistError });
      throw artistError;
    }

    const genres = await getArtistGenres(artistId);
    const primaryGenre = genres.find(g => g.isPrimary)?.genre ?? null;

    return {
      id: artistData.id,
      name: artistData.name,
      bio: artistData.bio,
      imageUrl: artistData.image_url,
      createdAt: artistData.created_at ?? new Date().toISOString(),
      updatedAt: artistData.updated_at ?? new Date().toISOString(),
      genre: artistData.genre,
      website: artistData.website,
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
    logApi({
      message: 'Adding genre to artist',
      details: { artistId, genreId, isPrimary },
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
      logApiError({ message: 'Failed to add genre to artist', details: error });
      throw error;
    }

    return {
      id: data.id,
      artistId: data.artist_id,
      genreId: data.genre_id,
      isPrimary: data.is_primary ?? false,
      createdAt: data.created_at ?? new Date().toISOString(),
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
    logApi({
      message: 'Removing genre from artist',
      details: { artistId, genreId },
    });

    const { error } = await supabase
      .from('artist_genres')
      .delete()
      .eq('artist_id', artistId)
      .eq('genre_id', genreId);

    if (error) {
      logApiError({ message: 'Failed to remove genre from artist', details: error });
      throw error;
    }

    logApi({ message: 'Genre removed from artist successfully' });
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
    logApi({
      message: 'Setting primary genre for artist',
      details: { artistId, genreId },
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
      logApiError({ message: 'Failed to set primary genre', details: error });
      throw error;
    }

    logApi({ message: 'Primary genre set successfully' });
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
    logApi({
      message: 'Updating artist genres',
      details: { artistId, genreCount: genreSelections.length },
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
        logApiError({ message: 'Failed to update artist genres', details: error });
        throw error;
      }
    }

    logApi({ message: 'Artist genres updated successfully' });
  } catch (error) {
    logger.error('Failed to update artist genres', { error, artistId });
    throw error;
  }
}

// ========================================
// Artist Existence Check Operations
// ========================================

export interface ArtistExistsResult {
  exists: boolean;
  matchType: 'name' | 'spotify_id' | 'soundcloud_id' | null;
  artistName?: string;
}

/**
 * Check if an artist already exists by name
 */
export async function checkArtistExistsByName(name: string): Promise<ArtistExistsResult> {
  try {
    logApi({ message: 'Checking if artist exists by name', details: { name } });

    const { data, error } = await supabase
      .from('artists')
      .select('id, name')
      .ilike('name', name.trim())
      .limit(1)
      .maybeSingle();

    if (error) {
      logApiError({ message: 'Failed to check artist by name', details: error });
      throw error;
    }

    if (data) {
      return { exists: true, matchType: 'name', artistName: data.name };
    }

    return { exists: false, matchType: null };
  } catch (error) {
    logger.error('Failed to check artist by name', { error, name });
    throw error;
  }
}

/**
 * Check if an artist already exists by Spotify ID
 */
export async function checkArtistExistsBySpotifyId(spotifyId: string): Promise<ArtistExistsResult> {
  try {
    logApi({ message: 'Checking if artist exists by Spotify ID', details: { spotifyId } });

    const { data, error } = await supabase
      .from('artists')
      .select('id, name, spotify_id')
      .eq('spotify_id', spotifyId)
      .limit(1)
      .maybeSingle();

    if (error) {
      logApiError({ message: 'Failed to check artist by Spotify ID', details: error });
      throw error;
    }

    if (data) {
      return { exists: true, matchType: 'spotify_id', artistName: data.name };
    }

    return { exists: false, matchType: null };
  } catch (error) {
    logger.error('Failed to check artist by Spotify ID', { error, spotifyId });
    throw error;
  }
}

/**
 * Check if an artist already exists by SoundCloud ID (username/permalink)
 */
export async function checkArtistExistsBySoundcloudId(soundcloudId: string): Promise<ArtistExistsResult> {
  try {
    logApi({ message: 'Checking if artist exists by SoundCloud ID', details: { soundcloudId } });

    const { data, error } = await supabase
      .from('artists')
      .select('id, name, soundcloud_id')
      .eq('soundcloud_id', soundcloudId)
      .limit(1)
      .maybeSingle();

    if (error) {
      logApiError({ message: 'Failed to check artist by SoundCloud ID', details: error });
      throw error;
    }

    if (data) {
      return { exists: true, matchType: 'soundcloud_id', artistName: data.name };
    }

    return { exists: false, matchType: null };
  } catch (error) {
    logger.error('Failed to check artist by SoundCloud ID', { error, soundcloudId });
    throw error;
  }
}

/**
 * Check if an artist registration is already pending by name, Spotify ID, or SoundCloud ID
 */
export async function checkPendingRegistration(params: {
  name?: string;
  spotifyId?: string;
  soundcloudId?: string;
}): Promise<ArtistExistsResult> {
  try {
    logApi({ message: 'Checking for pending artist registration', details: params });

    // Check by name first
    if (params.name) {
      const { data } = await supabase
        .from('artist_registrations')
        .select('id, artist_name')
        .ilike('artist_name', params.name.trim())
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();

      if (data) {
        return { exists: true, matchType: 'name', artistName: data.artist_name };
      }
    }

    // Check by Spotify ID
    if (params.spotifyId) {
      const { data } = await supabase
        .from('artist_registrations')
        .select('id, artist_name, spotify_id')
        .eq('spotify_id', params.spotifyId)
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();

      if (data) {
        return { exists: true, matchType: 'spotify_id', artistName: data.artist_name };
      }
    }

    // Check by SoundCloud ID
    if (params.soundcloudId) {
      const { data } = await supabase
        .from('artist_registrations')
        .select('id, artist_name, soundcloud_id')
        .eq('soundcloud_id', params.soundcloudId)
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();

      if (data) {
        return { exists: true, matchType: 'soundcloud_id', artistName: data.artist_name };
      }
    }

    return { exists: false, matchType: null };
  } catch (error) {
    logger.error('Failed to check pending registration', { error, params });
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
    logApi({
      message: 'Fetching artists by genre',
      details: { genreId, includeSubgenres, limit },
    });

    const { data, error } = await supabase.rpc('get_artists_by_genre', {
      genre_id_param: genreId,
      include_subgenres: includeSubgenres,
    });

    if (error) {
      logApiError({ message: 'Failed to fetch artists by genre', details: error });
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
    logApi({ message: 'Searching artists', details: { query, genreFilter, limit } });

    let dbQuery = supabase
      .from('artists')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(limit);

    const { data, error } = await dbQuery;

    if (error) {
      logApiError({ message: 'Failed to search artists', details: error });
      throw error;
    }

    let artists: Artist[] = data.map(row => ({
      id: row.id,
      name: row.name,
      bio: row.bio,
      imageUrl: row.image_url,
      createdAt: row.created_at ?? new Date().toISOString(),
      updatedAt: row.updated_at ?? new Date().toISOString(),
      genre: row.genre,
      website: row.website,
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
