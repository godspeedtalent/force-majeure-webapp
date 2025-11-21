/**
 * Artist and Genre Type Definitions
 *
 * Centralized types for artists and music genres with hierarchical support
 */

import { Tables } from '@/shared/api/supabase/types';

// ========================================
// Database Types (from Supabase)
// ========================================

export type GenreRow = Tables<'genres'>;
export type ArtistRow = Tables<'artists'>;
export type ArtistGenreRow = Tables<'artist_genres'>;

// ========================================
// Genre Types
// ========================================

/**
 * Base genre with database fields
 */
export interface Genre {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Genre with parent genre information
 */
export interface GenreWithParent extends Genre {
  parent: Genre | null;
}

/**
 * Genre with children (subgenres)
 */
export interface GenreWithChildren extends Genre {
  children: Genre[];
}

/**
 * Complete genre hierarchy node
 */
export interface GenreHierarchyNode extends Genre {
  parent: Genre | null;
  children: GenreHierarchyNode[];
  level: number;
  path: string; // e.g., "Electronic > House > Tech House"
}

/**
 * Genre tree for hierarchical display
 */
export interface GenreTree {
  topLevel: GenreHierarchyNode[];
  byId: Record<string, GenreHierarchyNode>;
  byName: Record<string, GenreHierarchyNode>;
}

// ========================================
// Artist-Genre Relationship Types
// ========================================

/**
 * Artist-Genre junction table entry
 */
export interface ArtistGenre {
  id: string;
  artistId: string;
  genreId: string;
  isPrimary: boolean;
  createdAt: string;
}

/**
 * Artist genre with full genre details
 */
export interface ArtistGenreWithDetails extends ArtistGenre {
  genre: GenreWithParent;
}

// ========================================
// Artist Types
// ========================================

/**
 * Base artist with database fields
 */
export interface Artist {
  id: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  // Legacy field - will be deprecated
  genre: string | null;
<<<<<<< HEAD
  // Spotify integration fields
  spotifyId: string | null;
  spotifyData: SpotifyArtistData | null;
}

/**
 * Spotify artist metadata cached in database
 */
export interface SpotifyArtistData {
  popularity: number;
  followers: number;
  externalUrls: {
    spotify: string;
  };
  uri: string;
  genres: string[];
=======
  website: string | null;
>>>>>>> 9dbe30b583ab4968f8e8afe7c49af6f16dc3fabe
}

/**
 * Artist with genre relationships
 */
export interface ArtistWithGenres extends Artist {
  genres: ArtistGenreWithDetails[];
  primaryGenre: GenreWithParent | null;
}

/**
 * Minimal artist info for lists and selections
 */
export interface ArtistSummary {
  id: string;
  name: string;
  imageUrl: string | null;
  primaryGenre: string | null;
}

// ========================================
// Form Types
// ========================================

/**
 * Form data for creating/editing artist
 */
export interface ArtistFormData {
  name: string;
  bio: string;
  imageUrl: string;
  socialLinks: string; // JSON string
  genreIds: string[]; // Array of genre IDs
  primaryGenreId: string | null; // ID of primary genre
}

/**
 * Genre selection for forms
 */
export interface GenreSelection {
  genreId: string;
  isPrimary: boolean;
}

// ========================================
// Utility Types
// ========================================

/**
 * Genre filter options for artist queries
 */
export interface GenreFilter {
  genreIds: string[];
  includeSubgenres: boolean;
  requirePrimary: boolean;
}

/**
 * Artist search/filter criteria
 */
export interface ArtistSearchCriteria {
  query?: string;
  genreFilter?: GenreFilter;
  limit?: number;
  offset?: number;
}

// ========================================
// Type Guards
// ========================================

export function isGenreWithParent(genre: Genre | GenreWithParent): genre is GenreWithParent {
  return 'parent' in genre;
}

export function isGenreWithChildren(genre: Genre | GenreWithChildren): genre is GenreWithChildren {
  return 'children' in genre;
}

export function isArtistWithGenres(artist: Artist | ArtistWithGenres): artist is ArtistWithGenres {
  return 'genres' in artist;
}

// ========================================
// Helper Functions
// ========================================

/**
 * Convert database row to Genre type
 */
export function genreFromRow(row: GenreRow): Genre {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to Artist type
 */
export function artistFromRow(row: ArtistRow): Artist {
  return {
    id: row.id,
    name: row.name,
    bio: row.bio,
    imageUrl: row.image_url,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    genre: row.genre,
<<<<<<< HEAD
    spotifyId: row.spotify_id ?? null,
    spotifyData: row.spotify_data ? (row.spotify_data as unknown as SpotifyArtistData) : null,
=======
    website: row.website,
>>>>>>> 9dbe30b583ab4968f8e8afe7c49af6f16dc3fabe
  };
}

/**
 * Convert database row to ArtistGenre type
 */
export function artistGenreFromRow(row: ArtistGenreRow): ArtistGenre {
  return {
    id: row.id,
    artistId: row.artist_id,
    genreId: row.genre_id,
    isPrimary: row.is_primary ?? false,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

/**
 * Get genre path as string (e.g., "Electronic > House > Tech House")
 */
export function getGenrePath(genre: GenreWithParent): string {
  const path: string[] = [genre.name];
  let current = genre.parent;

  while (current) {
    path.unshift(current.name);
    current = isGenreWithParent(current) ? current.parent : null;
  }

  return path.join(' > ');
}

/**
 * Find primary genre from artist genres list
 */
export function getPrimaryGenre(genres: ArtistGenreWithDetails[]): GenreWithParent | null {
  const primary = genres.find(ag => ag.isPrimary);
  return primary?.genre ?? null;
}
