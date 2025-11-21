/**
 * Spotify Artist Service
 *
 * Handles creating artists in the local database from Spotify data.
 * Hydrates artist records with Spotify metadata.
 */

import { supabase } from '@/shared/api/supabase/client';
import { logger } from '@/shared/services/logger';
import { logApiError, logApi } from '@/shared/utils/apiLogger';
import type { Artist, SpotifyArtistData } from '@/features/artists/types';
import type { SpotifyArtist } from './spotifyApiService';
import { getSpotifyArtist } from './spotifyApiService';

/**
 * Create artist in database from Spotify data
 */
export async function createArtistFromSpotify(spotifyId: string): Promise<Artist> {
  try {
    logApi('createArtistFromSpotify', 'Creating artist from Spotify data', { spotifyId });

    // Check if artist already exists with this Spotify ID
    const { data: existing, error: existingError } = await supabase
      .from('artists')
      .select('*')
      .eq('spotify_id', spotifyId)
      .maybeSingle();

    if (existingError) {
      logApiError('createArtistFromSpotify', 'Error checking for existing artist', existingError);
      throw existingError;
    }

    if (existing) {
      logger.info('Artist already exists with Spotify ID', { spotifyId, artistId: existing.id });
      return {
        id: existing.id,
        name: existing.name,
        bio: existing.bio,
        imageUrl: existing.image_url,
        socialLinks: existing.social_links as Record<string, string> | null,
        createdAt: existing.created_at,
        updatedAt: existing.updated_at,
        genre: existing.genre,
        spotifyId: existing.spotify_id,
        spotifyData: existing.spotify_data as SpotifyArtistData | null,
      };
    }

    // Fetch full artist data from Spotify
    const spotifyArtist = await getSpotifyArtist(spotifyId);

    // Transform Spotify data to our database format
    const artistData = transformSpotifyArtistToDbFormat(spotifyArtist);

    // Insert into database
    const { data: newArtist, error: insertError } = await supabase
      .from('artists')
      .insert(artistData)
      .select()
      .single();

    if (insertError) {
      logApiError('createArtistFromSpotify', 'Failed to create artist', insertError);
      throw insertError;
    }

    logger.info('Artist created from Spotify successfully', {
      spotifyId,
      artistId: newArtist.id,
      name: newArtist.name,
    });

    return {
      id: newArtist.id,
      name: newArtist.name,
      bio: newArtist.bio,
      imageUrl: newArtist.image_url,
      socialLinks: newArtist.social_links as Record<string, string> | null,
      createdAt: newArtist.created_at,
      updatedAt: newArtist.updated_at,
      genre: newArtist.genre,
      spotifyId: newArtist.spotify_id,
      spotifyData: newArtist.spotify_data as SpotifyArtistData | null,
    };
  } catch (error) {
    logger.error('Failed to create artist from Spotify', { error, spotifyId });
    throw error;
  }
}

/**
 * Transform Spotify artist data to database insert format
 */
function transformSpotifyArtistToDbFormat(spotifyArtist: SpotifyArtist) {
  // Get the best quality image (largest)
  const imageUrl =
    spotifyArtist.images.length > 0
      ? spotifyArtist.images.sort((a, b) => (b.width || 0) - (a.width || 0))[0].url
      : null;

  // Create bio from genres and popularity
  const genresText =
    spotifyArtist.genres.length > 0 ? spotifyArtist.genres.slice(0, 3).join(', ') : 'Various genres';
  const bio = `${spotifyArtist.name} is an artist known for ${genresText}.`;

  // Cache Spotify metadata
  const spotifyData: SpotifyArtistData = {
    popularity: spotifyArtist.popularity,
    followers: spotifyArtist.followers.total,
    externalUrls: spotifyArtist.external_urls,
    uri: spotifyArtist.uri,
    genres: spotifyArtist.genres,
  };

  // Build social links
  const socialLinks = {
    spotify: spotifyArtist.external_urls.spotify,
  };

  return {
    name: spotifyArtist.name,
    bio,
    image_url: imageUrl,
    social_links: socialLinks,
    spotify_id: spotifyArtist.id,
    spotify_data: spotifyData,
    // Use first genre as legacy genre field, or null
    genre: spotifyArtist.genres[0] ?? null,
    test_data: false,
  };
}

/**
 * Update existing artist with fresh Spotify data
 */
export async function refreshArtistFromSpotify(artistId: string): Promise<Artist> {
  try {
    logApi('refreshArtistFromSpotify', 'Refreshing artist from Spotify', { artistId });

    // Get existing artist
    const { data: existing, error: fetchError } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single();

    if (fetchError) {
      logApiError('refreshArtistFromSpotify', 'Failed to fetch artist', fetchError);
      throw fetchError;
    }

    if (!existing.spotify_id) {
      throw new Error('Artist does not have a Spotify ID');
    }

    // Fetch fresh data from Spotify
    const spotifyArtist = await getSpotifyArtist(existing.spotify_id);

    // Transform to database format
    const updatedData = transformSpotifyArtistToDbFormat(spotifyArtist);

    // Update database (preserve user-edited bio if it differs from auto-generated)
    const { data: updated, error: updateError } = await supabase
      .from('artists')
      .update({
        image_url: updatedData.image_url,
        spotify_data: updatedData.spotify_data,
        social_links: {
          ...(existing.social_links as Record<string, string> | null),
          spotify: spotifyArtist.external_urls.spotify,
        },
      })
      .eq('id', artistId)
      .select()
      .single();

    if (updateError) {
      logApiError('refreshArtistFromSpotify', 'Failed to update artist', updateError);
      throw updateError;
    }

    logger.info('Artist refreshed from Spotify successfully', { artistId });

    return {
      id: updated.id,
      name: updated.name,
      bio: updated.bio,
      imageUrl: updated.image_url,
      socialLinks: updated.social_links as Record<string, string> | null,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      genre: updated.genre,
      spotifyId: updated.spotify_id,
      spotifyData: updated.spotify_data as SpotifyArtistData | null,
    };
  } catch (error) {
    logger.error('Failed to refresh artist from Spotify', { error, artistId });
    throw error;
  }
}

/**
 * Check if an artist with a given Spotify ID already exists
 */
export async function checkArtistExistsBySpotifyId(spotifyId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('artists')
      .select('id')
      .eq('spotify_id', spotifyId)
      .maybeSingle();

    if (error) {
      logApiError('checkArtistExistsBySpotifyId', 'Error checking artist', error);
      throw error;
    }

    return data?.id ?? null;
  } catch (error) {
    logger.error('Failed to check artist by Spotify ID', { error, spotifyId });
    throw error;
  }
}
