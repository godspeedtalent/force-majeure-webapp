/**
 * useGalleryCoverImage Hook
 *
 * Fetches the cover image from a gallery for display purposes.
 * This is the primary way to get the "hero image" for artists, venues, and other entities.
 *
 * The cover image is determined by the `is_cover` flag on media_items within a gallery.
 * If no cover is set, returns the first image in the gallery.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getImageUrl } from '@/shared/utils/imageUtils';
import { logger } from '@/shared/services/logger';

interface GalleryCoverImageResult {
  /** The resolved URL of the cover image, or null if no gallery/images */
  coverImageUrl: string | null;
  /** All gallery images (for thumbnails, etc.) */
  galleryImages: GalleryImage[];
  /** Whether the query is loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
}

export interface GalleryImage {
  id: string;
  file_path: string;
  is_cover: boolean;
  url: string;
}

/**
 * Fetch the cover image for an artist by their gallery_id
 */
export function useArtistCoverImage(galleryId: string | null | undefined): GalleryCoverImageResult {
  const query = useQuery({
    queryKey: ['gallery-cover-image', 'artist', galleryId],
    queryFn: async (): Promise<{ coverImageUrl: string | null; galleryImages: GalleryImage[] }> => {
      if (!galleryId) return { coverImageUrl: null, galleryImages: [] };

      const { data, error } = await supabase
        .from('media_items')
        .select('id, file_path, is_cover')
        .eq('gallery_id', galleryId)
        .eq('is_active', true)
        .order('is_cover', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Failed to fetch artist gallery cover image', {
          error: error.message,
          source: 'useGalleryCoverImage',
          galleryId,
        });
        throw error;
      }

      const images = (data || []).map(item => ({
        ...item,
        url: getImageUrl(item.file_path),
      }));

      // Cover image is the one marked is_cover, or first image if none marked
      const coverImage = images.find(img => img.is_cover) || images[0];

      return {
        coverImageUrl: coverImage?.url || null,
        galleryImages: images,
      };
    },
    enabled: !!galleryId,
  });

  return {
    coverImageUrl: query.data?.coverImageUrl || null,
    galleryImages: query.data?.galleryImages || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Fetch the cover image for a venue by their venue_id
 * Venues use a different pattern - galleries have a venue_id FK and is_default flag
 */
export function useVenueCoverImage(venueId: string | null | undefined): GalleryCoverImageResult {
  const query = useQuery({
    queryKey: ['gallery-cover-image', 'venue', venueId],
    queryFn: async (): Promise<{ coverImageUrl: string | null; galleryImages: GalleryImage[] }> => {
      if (!venueId) return { coverImageUrl: null, galleryImages: [] };

      // First get the default gallery for this venue
      const { data: galleries, error: galleryError } = await supabase
        .from('media_galleries')
        .select('id')
        .eq('venue_id', venueId)
        .eq('is_default', true)
        .limit(1);

      if (galleryError) {
        logger.error('Failed to fetch venue gallery', {
          error: galleryError.message,
          source: 'useGalleryCoverImage',
          venueId,
        });
        throw galleryError;
      }

      if (!galleries || galleries.length === 0) {
        return { coverImageUrl: null, galleryImages: [] };
      }

      const galleryId = galleries[0].id;

      // Now get the images from this gallery
      const { data, error } = await supabase
        .from('media_items')
        .select('id, file_path, is_cover')
        .eq('gallery_id', galleryId)
        .eq('is_active', true)
        .order('is_cover', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Failed to fetch venue gallery images', {
          error: error.message,
          source: 'useGalleryCoverImage',
          venueId,
          galleryId,
        });
        throw error;
      }

      const images = (data || []).map(item => ({
        ...item,
        url: getImageUrl(item.file_path),
      }));

      // Cover image is the one marked is_cover, or first image if none marked
      const coverImage = images.find(img => img.is_cover) || images[0];

      return {
        coverImageUrl: coverImage?.url || null,
        galleryImages: images,
      };
    },
    enabled: !!venueId,
  });

  return {
    coverImageUrl: query.data?.coverImageUrl || null,
    galleryImages: query.data?.galleryImages || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Fetch the cover image for an event by their gallery_id
 */
export function useEventGalleryCoverImage(galleryId: string | null | undefined): GalleryCoverImageResult {
  const query = useQuery({
    queryKey: ['gallery-cover-image', 'event', galleryId],
    queryFn: async (): Promise<{ coverImageUrl: string | null; galleryImages: GalleryImage[] }> => {
      if (!galleryId) return { coverImageUrl: null, galleryImages: [] };

      const { data, error } = await supabase
        .from('media_items')
        .select('id, file_path, is_cover')
        .eq('gallery_id', galleryId)
        .eq('is_active', true)
        .order('is_cover', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Failed to fetch event gallery cover image', {
          error: error.message,
          source: 'useGalleryCoverImage',
          galleryId,
        });
        throw error;
      }

      const images = (data || []).map(item => ({
        ...item,
        url: getImageUrl(item.file_path),
      }));

      // Cover image is the one marked is_cover, or first image if none marked
      const coverImage = images.find(img => img.is_cover) || images[0];

      return {
        coverImageUrl: coverImage?.url || null,
        galleryImages: images,
      };
    },
    enabled: !!galleryId,
  });

  return {
    coverImageUrl: query.data?.coverImageUrl || null,
    galleryImages: query.data?.galleryImages || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
