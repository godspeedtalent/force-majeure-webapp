/**
 * useVenueGallery Hook
 *
 * Manages all venue gallery operations including:
 * - Fetching galleries and items
 * - Creating/updating/deleting galleries
 * - Uploading media files
 * - Setting cover images
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { getImageUrl } from '@/shared/utils/imageUtils';
import { logger } from '@/shared/services/logger';
import { toast } from 'sonner';
import type { ResolvedMediaItem, MediaGallery, MediaItem } from '@/features/media/types';

interface UseVenueGalleryProps {
  venueId: string;
  venueName: string;
  onHeroImageChange?: (imageUrl: string | null) => void;
}

export interface VenueGalleryState {
  selectedGalleryId: string | null;
  setSelectedGalleryId: (id: string | null) => void;
  selectedGallery: MediaGallery | null;
  galleries: MediaGallery[];
  items: ResolvedMediaItem[];
  galleriesLoading: boolean;
  itemsLoading: boolean;
}

export interface VenueGalleryActions {
  createGallery: (name: string) => Promise<void>;
  updateGalleryName: (name: string) => Promise<void>;
  deleteGallery: (galleryId: string) => Promise<void>;
  uploadFiles: (files: FileList | null) => Promise<void>;
  updateMediaItem: (itemId: string, data: Partial<MediaItem>) => Promise<void>;
  deleteMediaItem: (itemId: string) => Promise<void>;
  setCoverImage: (itemId: string) => Promise<void>;
}

export interface VenueGalleryUploadState {
  uploading: boolean;
  uploadingCount: number;
}

export function useVenueGallery({
  venueId,
  venueName,
  onHeroImageChange,
}: UseVenueGalleryProps): {
  state: VenueGalleryState;
  actions: VenueGalleryActions;
  uploadState: VenueGalleryUploadState;
} {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  // Selected gallery state
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  // Fetch galleries for this venue
  const { data: galleries = [], isLoading: galleriesLoading } = useQuery({
    queryKey: ['venue-galleries', venueId],
    queryFn: async (): Promise<MediaGallery[]> => {
      const { data, error } = await (supabase as any)
        .from('media_galleries')
        .select('*')
        .eq('venue_id', venueId)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        logger.error('Failed to fetch venue galleries', {
          error: error.message,
          source: 'useVenueGallery',
          venueId,
        });
        throw error;
      }
      return data || [];
    },
  });

  // Get selected gallery object
  const selectedGallery = galleries.find(g => g.id === selectedGalleryId) || null;

  // Fetch items for selected gallery
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['venue-gallery-items', selectedGalleryId],
    queryFn: async (): Promise<ResolvedMediaItem[]> => {
      if (!selectedGalleryId) return [];

      const { data, error } = await (supabase as any)
        .from('media_items')
        .select('*')
        .eq('gallery_id', selectedGalleryId)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Failed to fetch gallery items', {
          error: error.message,
          source: 'useVenueGallery',
        });
        throw error;
      }

      return ((data || []) as MediaItem[]).map(item => ({
        ...item,
        url: getImageUrl(item.file_path),
        thumbnailUrl: item.thumbnail_path ? getImageUrl(item.thumbnail_path) : null,
      }));
    },
    enabled: !!selectedGalleryId,
  });

  // Auto-create default gallery if none exists
  useEffect(() => {
    const createDefaultGallery = async () => {
      if (galleriesLoading || galleries.length > 0) return;

      try {
        const slug = `venue-${venueId}-default`;
        const { data, error } = await (supabase as any)
          .from('media_galleries')
          .insert({
            slug,
            name: `${venueName} Gallery`,
            venue_id: venueId,
            is_default: true,
            allowed_types: ['image'],
          })
          .select()
          .single();

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['venue-galleries', venueId] });
        setSelectedGalleryId(data.id);
        toast.success(t('venueGallery.defaultGalleryCreated', 'Default gallery created'));
      } catch (error) {
        logger.error('Failed to create default gallery', {
          error: error instanceof Error ? error.message : 'Unknown',
          source: 'useVenueGallery',
        });
      }
    };

    createDefaultGallery();
  }, [galleriesLoading, galleries.length, venueId, venueName, queryClient, t]);

  // Auto-select default gallery
  useEffect(() => {
    if (galleries.length > 0 && !selectedGalleryId) {
      const defaultGallery = galleries.find(g => g.is_default) || galleries[0];
      setSelectedGalleryId(defaultGallery.id);
    }
  }, [galleries, selectedGalleryId]);

  // Notify parent when cover image changes
  useEffect(() => {
    if (selectedGallery?.is_default && onHeroImageChange) {
      const coverItem = items.find(item => item.is_cover);
      onHeroImageChange(coverItem?.url || null);
    }
  }, [items, selectedGallery?.is_default, onHeroImageChange]);

  // Create gallery
  const createGallery = useCallback(
    async (name: string) => {
      const slug = `venue-${venueId}-${name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')}`;

      const { data, error } = await (supabase as any)
        .from('media_galleries')
        .insert({
          slug,
          name,
          venue_id: venueId,
          is_default: false,
          allowed_types: ['image'],
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create gallery', {
          error: error.message,
          source: 'useVenueGallery',
        });
        throw error;
      }

      toast.success(t('venueGallery.galleryCreated', 'Gallery created'));
      queryClient.invalidateQueries({ queryKey: ['venue-galleries', venueId] });
      setSelectedGalleryId(data.id);
    },
    [venueId, queryClient, t]
  );

  // Update gallery name
  const updateGalleryName = useCallback(
    async (name: string) => {
      if (!selectedGallery) return;

      const { error } = await (supabase as any)
        .from('media_galleries')
        .update({ name: name.trim() })
        .eq('id', selectedGallery.id);

      if (error) {
        logger.error('Failed to update gallery', {
          error: error.message,
          source: 'useVenueGallery',
        });
        throw error;
      }

      toast.success(t('venueGallery.galleryUpdated', 'Gallery updated'));
      queryClient.invalidateQueries({ queryKey: ['venue-galleries', venueId] });
    },
    [selectedGallery, queryClient, venueId, t]
  );

  // Delete gallery
  const deleteGallery = useCallback(
    async (galleryId: string) => {
      const { error } = await (supabase as any)
        .from('media_galleries')
        .delete()
        .eq('id', galleryId);

      if (error) {
        logger.error('Failed to delete gallery', {
          error: error.message,
          source: 'useVenueGallery',
        });
        throw error;
      }

      toast.success(t('venueGallery.galleryDeleted', 'Gallery deleted'));
      queryClient.invalidateQueries({ queryKey: ['venue-galleries', venueId] });
      if (selectedGalleryId === galleryId) {
        setSelectedGalleryId(null);
      }
    },
    [queryClient, venueId, selectedGalleryId, t]
  );

  // Upload files
  const uploadFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || !selectedGalleryId) return;

      const fileArray = Array.from(files);
      setUploading(true);
      setUploadingCount(fileArray.length);

      try {
        for (const file of fileArray) {
          const fileExt = file.name.split('.').pop();
          const fileName = `venues/${venueId}/${selectedGalleryId}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Get max display order
          const { data: existingItems } = await (supabase as any)
            .from('media_items')
            .select('display_order')
            .eq('gallery_id', selectedGalleryId)
            .order('display_order', { ascending: false })
            .limit(1);

          const nextOrder =
            existingItems && existingItems.length > 0 ? existingItems[0].display_order + 1 : 0;

          // Create media item
          const { error: itemError } = await (supabase as any)
            .from('media_items')
            .insert({
              gallery_id: selectedGalleryId,
              file_path: fileName,
              media_type: file.type.startsWith('video/')
                ? 'video'
                : file.type.startsWith('audio/')
                  ? 'audio'
                  : 'image',
              title: file.name.replace(/\.[^/.]+$/, ''),
              display_order: nextOrder,
            });

          if (itemError) throw itemError;

          setUploadingCount(prev => Math.max(0, prev - 1));
        }

        toast.success(t('venueGallery.mediaUploaded', 'Media uploaded'));
        queryClient.invalidateQueries({ queryKey: ['venue-gallery-items', selectedGalleryId] });
      } catch (error) {
        logger.error('Failed to upload file', {
          error: error instanceof Error ? error.message : 'Unknown',
          source: 'useVenueGallery',
        });
        toast.error(t('venueGallery.uploadFailed', 'Failed to upload file'));
      } finally {
        setUploading(false);
        setUploadingCount(0);
      }
    },
    [selectedGalleryId, venueId, queryClient, t]
  );

  // Update media item
  const updateMediaItem = useCallback(
    async (itemId: string, data: Partial<MediaItem>) => {
      const { error } = await (supabase as any)
        .from('media_items')
        .update(data)
        .eq('id', itemId);

      if (error) {
        logger.error('Failed to update media', {
          error: error.message,
          source: 'useVenueGallery',
        });
        throw error;
      }

      toast.success(t('venueGallery.mediaUpdated', 'Media updated'));
      queryClient.invalidateQueries({ queryKey: ['venue-gallery-items', selectedGalleryId] });
    },
    [selectedGalleryId, queryClient, t]
  );

  // Delete media item
  const deleteMediaItem = useCallback(
    async (itemId: string) => {
      const { error } = await (supabase as any)
        .from('media_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        logger.error('Failed to delete media', {
          error: error.message,
          source: 'useVenueGallery',
        });
        throw error;
      }

      toast.success(t('venueGallery.mediaDeleted', 'Media deleted'));
      queryClient.invalidateQueries({ queryKey: ['venue-gallery-items', selectedGalleryId] });
    },
    [selectedGalleryId, queryClient, t]
  );

  // Set cover image
  const setCoverImage = useCallback(
    async (itemId: string) => {
      if (!selectedGalleryId) return;

      // Unset all is_cover in this gallery
      const { error: unsetError } = await (supabase as any)
        .from('media_items')
        .update({ is_cover: false })
        .eq('gallery_id', selectedGalleryId);

      if (unsetError) {
        logger.error('Failed to unset cover', {
          error: unsetError.message,
          source: 'useVenueGallery',
        });
        throw unsetError;
      }

      // Set this item as cover
      const { error: setError } = await (supabase as any)
        .from('media_items')
        .update({ is_cover: true })
        .eq('id', itemId);

      if (setError) {
        logger.error('Failed to set cover', {
          error: setError.message,
          source: 'useVenueGallery',
        });
        throw setError;
      }

      toast.success(t('venueGallery.coverSet', 'Cover image set'));
      queryClient.invalidateQueries({ queryKey: ['venue-gallery-items', selectedGalleryId] });
    },
    [selectedGalleryId, queryClient, t]
  );

  return {
    state: {
      selectedGalleryId,
      setSelectedGalleryId,
      selectedGallery,
      galleries,
      items,
      galleriesLoading,
      itemsLoading,
    },
    actions: {
      createGallery,
      updateGalleryName,
      deleteGallery,
      uploadFiles,
      updateMediaItem,
      deleteMediaItem,
      setCoverImage,
    },
    uploadState: {
      uploading,
      uploadingCount,
    },
  };
}
