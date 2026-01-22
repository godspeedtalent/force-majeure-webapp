/**
 * useGalleryManagement Hook
 *
 * Provides CRUD operations for managing galleries and media items.
 * Used by admin/developer gallery management UI.
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, logger, handleError } from '@/shared';
import { getImageUrl } from '@/shared/utils/imageUtils';
import { toast } from 'sonner';
import type {
  MediaGallery,
  MediaItem,
  ResolvedMediaItem,
  MediaType,
} from '../types';

interface UseGalleryManagementResult {
  // Galleries
  galleries: MediaGallery[];
  galleriesLoading: boolean;
  selectedGallery: MediaGallery | null;
  setSelectedGallery: (gallery: MediaGallery | null) => void;

  // Media items
  items: ResolvedMediaItem[];
  itemsLoading: boolean;

  // Operations
  createGallery: (data: CreateGalleryInput) => Promise<MediaGallery | null>;
  updateGallery: (id: string, data: UpdateGalleryInput) => Promise<boolean>;
  deleteGallery: (id: string) => Promise<boolean>;

  createMediaItem: (data: CreateMediaItemInput) => Promise<MediaItem | null>;
  updateMediaItem: (id: string, data: UpdateMediaItemInput) => Promise<boolean>;
  deleteMediaItem: (id: string) => Promise<boolean>;
  reorderMediaItems: (orderedIds: string[]) => Promise<boolean>;
  setCoverItem: (id: string) => Promise<boolean>;

  // Upload
  uploadFile: (file: File, galleryId: string) => Promise<string | null>;
}

interface CreateGalleryInput {
  slug: string;
  name: string;
  description?: string;
  allowed_types?: MediaType[];
}

interface UpdateGalleryInput {
  name?: string;
  description?: string;
  allowed_types?: MediaType[];
  is_active?: boolean;
}

interface CreateMediaItemInput {
  gallery_id: string;
  file_path: string;
  media_type?: MediaType;
  alt_text?: string;
  title?: string;
  description?: string;
  creator?: string;
  year?: number;
  tags?: string[];
}

interface UpdateMediaItemInput {
  alt_text?: string;
  title?: string;
  description?: string;
  creator?: string;
  year?: number;
  tags?: string[];
  is_active?: boolean;
  display_order?: number;
  is_cover?: boolean;
}

export const useGalleryManagement = (): UseGalleryManagementResult => {
  const queryClient = useQueryClient();
  const [selectedGallery, setSelectedGallery] = useState<MediaGallery | null>(
    null
  );

  // Fetch all galleries
  const galleriesQuery = useQuery({
    queryKey: ['galleries-management'],
    queryFn: async (): Promise<MediaGallery[]> => {
      const { data, error } = await (supabase as any)
        .from('media_galleries')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        logger.error('Failed to fetch galleries', {
          error: error.message,
          source: 'useGalleryManagement',
        });
        throw error;
      }
      return data || [];
    },
  });

  // Fetch items for selected gallery
  const itemsQuery = useQuery({
    queryKey: ['gallery-items-management', selectedGallery?.id],
    queryFn: async (): Promise<ResolvedMediaItem[]> => {
      if (!selectedGallery) return [];

      const { data, error } = await (supabase as any)
        .from('media_items')
        .select('*')
        .eq('gallery_id', selectedGallery.id)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Failed to fetch gallery items', {
          error: error.message,
          source: 'useGalleryManagement',
        });
        throw error;
      }

      return ((data || []) as MediaItem[]).map(item => ({
        ...item,
        url: getImageUrl(item.file_path),
        thumbnailUrl: item.thumbnail_path
          ? getImageUrl(item.thumbnail_path)
          : null,
      }));
    },
    enabled: !!selectedGallery,
  });

  // Create gallery
  const createGallery = useCallback(
    async (input: CreateGalleryInput): Promise<MediaGallery | null> => {
      try {
        const { data, error } = await (supabase as any)
          .from('media_galleries')
          .insert({
            slug: input.slug,
            name: input.name,
            description: input.description || null,
            allowed_types: input.allowed_types || ['image'],
          })
          .select()
          .single();

        if (error) throw error;

        toast.success('Gallery created');
        queryClient.invalidateQueries({ queryKey: ['galleries-management'] });
        return data;
      } catch (error) {
        handleError(error, {
          title: 'Failed to create gallery',
          context: 'useGalleryManagement.createGallery',
          showToast: true,
        });
        return null;
      }
    },
    [queryClient]
  );

  // Update gallery
  const updateGallery = useCallback(
    async (id: string, input: UpdateGalleryInput): Promise<boolean> => {
      try {
        const { error } = await (supabase as any)
          .from('media_galleries')
          .update(input)
          .eq('id', id);

        if (error) throw error;

        toast.success('Gallery updated');
        queryClient.invalidateQueries({ queryKey: ['galleries-management'] });
        return true;
      } catch (error) {
        handleError(error, {
          title: 'Failed to update gallery',
          context: 'useGalleryManagement.updateGallery',
          showToast: true,
        });
        return false;
      }
    },
    [queryClient]
  );

  // Delete gallery
  const deleteGallery = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await (supabase as any)
          .from('media_galleries')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast.success('Gallery deleted');
        queryClient.invalidateQueries({ queryKey: ['galleries-management'] });
        if (selectedGallery?.id === id) {
          setSelectedGallery(null);
        }
        return true;
      } catch (error) {
        handleError(error, {
          title: 'Failed to delete gallery',
          context: 'useGalleryManagement.deleteGallery',
          showToast: true,
        });
        return false;
      }
    },
    [queryClient, selectedGallery]
  );

  // Create media item
  const createMediaItem = useCallback(
    async (input: CreateMediaItemInput): Promise<MediaItem | null> => {
      try {
        // Get max display order
        const { data: existingItems } = await (supabase as any)
          .from('media_items')
          .select('display_order')
          .eq('gallery_id', input.gallery_id)
          .order('display_order', { ascending: false })
          .limit(1);

        const nextOrder =
          existingItems && existingItems.length > 0
            ? existingItems[0].display_order + 1
            : 0;

        const { data, error } = await (supabase as any)
          .from('media_items')
          .insert({
            gallery_id: input.gallery_id,
            file_path: input.file_path,
            media_type: input.media_type || 'image',
            alt_text: input.alt_text || null,
            title: input.title || null,
            description: input.description || null,
            creator: input.creator || null,
            year: input.year || null,
            tags: input.tags || null,
            display_order: nextOrder,
          })
          .select()
          .single();

        if (error) throw error;

        toast.success('Media added');
        queryClient.invalidateQueries({
          queryKey: ['gallery-items-management'],
        });
        queryClient.invalidateQueries({ queryKey: ['gallery'] });
        return data;
      } catch (error) {
        handleError(error, {
          title: 'Failed to add media',
          context: 'useGalleryManagement.createMediaItem',
          showToast: true,
        });
        return null;
      }
    },
    [queryClient]
  );

  // Update media item
  const updateMediaItem = useCallback(
    async (id: string, input: UpdateMediaItemInput): Promise<boolean> => {
      try {
        const { error } = await (supabase as any)
          .from('media_items')
          .update(input)
          .eq('id', id);

        if (error) throw error;

        toast.success('Media updated');
        queryClient.invalidateQueries({
          queryKey: ['gallery-items-management'],
        });
        queryClient.invalidateQueries({ queryKey: ['gallery'] });
        return true;
      } catch (error) {
        handleError(error, {
          title: 'Failed to update media',
          context: 'useGalleryManagement.updateMediaItem',
          showToast: true,
        });
        return false;
      }
    },
    [queryClient]
  );

  // Delete media item
  const deleteMediaItem = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error } = await (supabase as any)
          .from('media_items')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast.success('Media deleted');
        queryClient.invalidateQueries({
          queryKey: ['gallery-items-management'],
        });
        queryClient.invalidateQueries({ queryKey: ['gallery'] });
        return true;
      } catch (error) {
        handleError(error, {
          title: 'Failed to delete media',
          context: 'useGalleryManagement.deleteMediaItem',
          showToast: true,
        });
        return false;
      }
    },
    [queryClient]
  );

  // Reorder media items
  const reorderMediaItems = useCallback(
    async (orderedIds: string[]): Promise<boolean> => {
      try {
        const updates = orderedIds.map((id, index) => ({
          id,
          display_order: index,
        }));

        for (const update of updates) {
          const { error } = await (supabase as any)
            .from('media_items')
            .update({ display_order: update.display_order })
            .eq('id', update.id);

          if (error) throw error;
        }

        queryClient.invalidateQueries({
          queryKey: ['gallery-items-management'],
        });
        queryClient.invalidateQueries({ queryKey: ['gallery'] });
        return true;
      } catch (error) {
        handleError(error, {
          title: 'Failed to reorder',
          context: 'useGalleryManagement.reorderMediaItems',
          showToast: true,
        });
        return false;
      }
    },
    [queryClient]
  );

  // Set cover item (unsets all others in the gallery)
  const setCoverItem = useCallback(
    async (id: string): Promise<boolean> => {
      if (!selectedGallery) return false;

      try {
        // First, unset all is_cover in this gallery
        const { error: unsetError } = await (supabase as any)
          .from('media_items')
          .update({ is_cover: false })
          .eq('gallery_id', selectedGallery.id);

        if (unsetError) throw unsetError;

        // Then set this item as cover
        const { error: setError } = await (supabase as any)
          .from('media_items')
          .update({ is_cover: true })
          .eq('id', id);

        if (setError) throw setError;

        toast.success('Cover image set');
        queryClient.invalidateQueries({
          queryKey: ['gallery-items-management'],
        });
        queryClient.invalidateQueries({ queryKey: ['gallery'] });
        queryClient.invalidateQueries({ queryKey: ['artist-gallery-images'] });
        return true;
      } catch (error) {
        handleError(error, {
          title: 'Failed to set cover image',
          context: 'useGalleryManagement.setCoverItem',
          showToast: true,
        });
        return false;
      }
    },
    [queryClient, selectedGallery]
  );

  // Upload file to storage
  const uploadFile = useCallback(
    async (file: File, galleryId: string): Promise<string | null> => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${galleryId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        return fileName;
      } catch (error) {
        handleError(error, {
          title: 'Failed to upload file',
          context: 'useGalleryManagement.uploadFile',
          showToast: true,
        });
        return null;
      }
    },
    []
  );

  return {
    galleries: galleriesQuery.data || [],
    galleriesLoading: galleriesQuery.isLoading,
    selectedGallery,
    setSelectedGallery,

    items: itemsQuery.data || [],
    itemsLoading: itemsQuery.isLoading,

    createGallery,
    updateGallery,
    deleteGallery,

    createMediaItem,
    updateMediaItem,
    deleteMediaItem,
    reorderMediaItems,
    setCoverItem,

    uploadFile,
  };
};

export default useGalleryManagement;
