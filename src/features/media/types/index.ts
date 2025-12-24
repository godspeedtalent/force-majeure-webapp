/**
 * Media Library Types
 *
 * Types for the media gallery system that manages images, videos, and audio
 * organized into galleries referenced by slug.
 */

export type MediaType = 'image' | 'video' | 'audio';

export interface MediaGallery {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  allowed_types: MediaType[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id: string;
  gallery_id: string;
  media_type: MediaType;

  // File info
  file_path: string;
  thumbnail_path: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;

  // Dimensions
  width: number | null;
  height: number | null;
  duration_seconds: number | null;

  // Metadata
  alt_text: string | null;
  title: string | null;
  description: string | null;
  creator: string | null;
  year: number | null;
  tags: string[] | null;

  // Display
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Media item with resolved URL from Supabase Storage
 */
export interface ResolvedMediaItem extends MediaItem {
  url: string;
  thumbnailUrl: string | null;
}

/**
 * Options for filtering gallery items
 */
export interface GalleryFilterOptions {
  types?: MediaType[];
  tags?: string[];
  year?: number;
  limit?: number;
}

/**
 * Gallery slugs used in the application
 * Add new gallery slugs here as constants
 */
export const GALLERY_SLUGS = {
  ARTIST_SIGNUP_CAROUSEL: 'artist-signup-carousel',
} as const;

export type GallerySlug = (typeof GALLERY_SLUGS)[keyof typeof GALLERY_SLUGS];
