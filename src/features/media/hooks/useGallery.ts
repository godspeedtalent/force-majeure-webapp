/**
 * useGallery Hook
 *
 * Fetches media items from a gallery by slug.
 * Resolves Supabase Storage URLs automatically.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase, logger } from '@/shared';
import { getImageUrl } from '@/shared/utils/imageUtils';
import type {
  MediaItem,
  ResolvedMediaItem,
  GalleryFilterOptions,
  GallerySlug,
} from '../types';

interface UseGalleryResult {
  items: ResolvedMediaItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch media items from a gallery by slug
 *
 * @param slug - The gallery slug to fetch items from
 * @param options - Optional filters for the gallery items
 * @returns Gallery items with resolved URLs
 *
 * @example
 * ```tsx
 * const { items, isLoading } = useGallery('artist-signup-carousel');
 *
 * // With type filter
 * const { items } = useGallery('promo-content', { types: ['video'] });
 * ```
 */
export const useGallery = (
  slug: GallerySlug | string,
  options: GalleryFilterOptions = {}
): UseGalleryResult => {
  const { types, tags, year, limit } = options;

  const query = useQuery({
    queryKey: ['gallery', slug, options],
    queryFn: async (): Promise<ResolvedMediaItem[]> => {
      // First get the gallery by slug
      // Note: Using 'as any' until Supabase types are regenerated after migration
      const { data: gallery, error: galleryError } = await (supabase as any)
        .from('media_galleries')
        .select('id')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (galleryError) {
        logger.error('Failed to fetch gallery', {
          error: galleryError.message,
          slug,
          source: 'useGallery',
        });
        throw new Error(`Gallery not found: ${slug}`);
      }

      // Build query for media items
      // Note: Using 'as any' until Supabase types are regenerated after migration
      let itemsQuery = (supabase as any)
        .from('media_items')
        .select('*')
        .eq('gallery_id', gallery.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      // Apply filters
      if (types && types.length > 0) {
        itemsQuery = itemsQuery.in('media_type', types);
      }

      if (tags && tags.length > 0) {
        itemsQuery = itemsQuery.overlaps('tags', tags);
      }

      if (year) {
        itemsQuery = itemsQuery.eq('year', year);
      }

      if (limit) {
        itemsQuery = itemsQuery.limit(limit);
      }

      const { data: items, error: itemsError } = await itemsQuery;

      if (itemsError) {
        logger.error('Failed to fetch gallery items', {
          error: itemsError.message,
          galleryId: gallery.id,
          source: 'useGallery',
        });
        throw new Error('Failed to fetch gallery items');
      }

      // Resolve storage URLs
      const resolvedItems: ResolvedMediaItem[] = ((items || []) as MediaItem[]).map(
        item => ({
          ...item,
          url: getImageUrl(item.file_path),
          thumbnailUrl: item.thumbnail_path
            ? getImageUrl(item.thumbnail_path)
            : null,
        })
      );

      return resolvedItems;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useGallery;
