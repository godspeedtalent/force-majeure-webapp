import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Image as ImageIcon, Star } from 'lucide-react';
import { supabase } from '@/shared';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmI18nCommon } from '@/components/common/i18n';
import { imageUploadService } from '@/shared';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';

/** Maximum file size for gallery images (2MB) */
const MAX_GALLERY_IMAGE_SIZE = 2 * 1024 * 1024;

interface MediaItem {
  id: string;
  file_path: string;
  title: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  is_cover: boolean;
}

interface ArtistManageGalleryTabProps {
  artistId: string;
  artistName: string;
  galleryId: string | null;
}

export function ArtistManageGalleryTab({
  artistId,
  artistName,
  galleryId,
}: ArtistManageGalleryTabProps) {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    isCover: boolean;
  } | null>(null);

  // Fetch or create gallery
  const { data: gallery, isLoading: galleryLoading } = useQuery({
    queryKey: ['artist-gallery', artistId],
    queryFn: async () => {
      if (galleryId) {
        const { data, error } = await supabase
          .from('media_galleries')
          .select('*')
          .eq('id', galleryId)
          .single();
        
        if (error) throw error;
        return data;
      }
      return null;
    },
    enabled: !!artistId,
  });

  // Fetch gallery items
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['artist-gallery-items', gallery?.id],
    queryFn: async () => {
      if (!gallery?.id) return [];
      
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .eq('gallery_id', gallery.id)
        .eq('is_active', true)
        .order('is_cover', { ascending: false }) // Cover first
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as MediaItem[];
    },
    enabled: !!gallery?.id,
  });

  // Create gallery mutation
  const createGalleryMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_artist_gallery', {
        p_artist_id: artistId,
        p_artist_name: artistName,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(tToast('gallery.created'));
      queryClient.invalidateQueries({ queryKey: ['artist-gallery', artistId] });
      queryClient.invalidateQueries({ queryKey: ['artist', artistId] });
    },
    onError: (error) => {
      handleError(error, { title: tToast('gallery.createFailed') });
    },
  });

  // Delete item mutation - handles cover auto-swap
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // Check if this is the cover image
      const itemToDelete = items.find(i => i.id === itemId);
      const wasCover = itemToDelete?.is_cover;

      const { error } = await supabase
        .from('media_items')
        .update({ is_active: false })
        .eq('id', itemId);

      if (error) throw error;

      // If we deleted the cover, auto-promote another item or clear image_url
      if (wasCover) {
        const remainingItems = items.filter(i => i.id !== itemId);
        if (remainingItems.length > 0) {
          // Promote the first remaining item to cover
          const newCover = remainingItems[0];
          await supabase
            .from('media_items')
            .update({ is_cover: true })
            .eq('id', newCover.id);
          // Update artist's image_url to match new cover
          await supabase
            .from('artists')
            .update({ image_url: newCover.file_path })
            .eq('id', artistId);
        } else {
          // No remaining items, clear artist's image_url
          await supabase
            .from('artists')
            .update({ image_url: null })
            .eq('id', artistId);
        }
      }
    },
    onSuccess: () => {
      toast.success(tToast('gallery.itemDeleted'));
      queryClient.invalidateQueries({ queryKey: ['artist-gallery-items', gallery?.id] });
      queryClient.invalidateQueries({ queryKey: ['artist', artistId] });
      setDeleteConfirm(null);
    },
    onError: (error) => {
      handleError(error, { title: tToast('gallery.deleteItemFailed') });
    },
  });

  // Set cover mutation
  const setCoverMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const item = items.find(i => i.id === itemId);
      if (!item || !gallery?.id) throw new Error('Item not found');

      // Unset current cover(s)
      await supabase
        .from('media_items')
        .update({ is_cover: false })
        .eq('gallery_id', gallery.id);

      // Set new cover
      const { error: coverError } = await supabase
        .from('media_items')
        .update({ is_cover: true })
        .eq('id', itemId);

      if (coverError) throw coverError;

      // Update artist's image_url to match cover
      const { error: artistError } = await supabase
        .from('artists')
        .update({ image_url: item.file_path })
        .eq('id', artistId);

      if (artistError) throw artistError;
    },
    onSuccess: () => {
      toast.success(tToast('gallery.coverSet'));
      queryClient.invalidateQueries({ queryKey: ['artist-gallery-items', gallery?.id] });
      queryClient.invalidateQueries({ queryKey: ['artist', artistId] });
    },
    onError: (error) => {
      handleError(error, { title: tToast('gallery.setCoverFailed') });
    },
  });

  const handleFileUpload = async (file: File) => {
    if (!gallery?.id) return;

    const isFirstImage = items.length === 0;
    setIsUploading(true);
    try {
      const result = await imageUploadService.uploadImage({
        file,
        isPrimary: false,
        compressionOptions: {
          maxSizeBytes: MAX_GALLERY_IMAGE_SIZE,
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85,
        },
      });

      // Create media item - first image becomes cover
      const { error } = await supabase
        .from('media_items')
        .insert({
          gallery_id: gallery.id,
          file_path: result.publicUrl,
          media_type: 'image' as const,
          display_order: items.length,
          is_active: true,
          is_cover: isFirstImage,
        });

      if (error) throw error;

      // If first image, also update artist's image_url
      if (isFirstImage) {
        await supabase
          .from('artists')
          .update({ image_url: result.publicUrl })
          .eq('id', artistId);
      }

      toast.success(tToast('gallery.imageUploaded'));
      queryClient.invalidateQueries({ queryKey: ['artist-gallery-items', gallery?.id] });
      queryClient.invalidateQueries({ queryKey: ['artist', artistId] });
    } catch (error) {
      handleError(error, { title: tToast('gallery.uploadFailed') });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  if (galleryLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <FmCommonLoadingSpinner size='lg' />
      </div>
    );
  }

  // No gallery yet - show create option
  if (!gallery) {
    return (
      <FmCommonCard size='lg' hoverable={false}>
        <div className='text-center py-12'>
          <ImageIcon className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
          <h3 className='text-lg font-semibold mb-2'>{t('gallery.noGalleryYet')}</h3>
          <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
            {t('gallery.createGalleryDescription')}
          </p>
          <FmCommonButton
            onClick={() => createGalleryMutation.mutate()}
            disabled={createGalleryMutation.isPending}
          >
            {createGalleryMutation.isPending ? t('buttons.creating') : t('gallery.createGallery')}
          </FmCommonButton>
        </div>
      </FmCommonCard>
    );
  }

  return (
    <div className='space-y-6'>
      <FmCommonCard size='lg' hoverable={false}>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <FmI18nCommon i18nKey='gallery.pressPhotos' as='h2' className='text-xl font-semibold' />
            <p className='text-muted-foreground text-sm mt-1'>
              {t('gallery.pressPhotosDescription')}
            </p>
          </div>
          <FmCommonButton
            icon={Plus}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? t('buttons.uploading') : t('gallery.addPhoto')}
          </FmCommonButton>
        </div>

        <input
          ref={fileInputRef}
          type='file'
          accept='image/jpeg,image/jpg,image/png,image/webp'
          onChange={handleFileChange}
          className='hidden'
        />

        {itemsLoading ? (
          <div className='flex items-center justify-center py-8'>
            <FmCommonLoadingSpinner />
          </div>
        ) : items.length === 0 ? (
          <div className='border-2 border-dashed border-white/20 rounded-none p-12 text-center'>
            <ImageIcon className='h-12 w-12 text-muted-foreground mx-auto mb-3' />
            <p className='text-muted-foreground'>{t('gallery.noPhotosYet')}</p>
            <p className='text-muted-foreground text-sm mt-1'>
              {t('gallery.uploadPhotosToGetStarted')}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
            {items.map((item, index) => (
              <div
                key={item.id}
                className='group relative aspect-square overflow-hidden bg-black/20'
              >
                <img
                  src={item.file_path}
                  alt={item.title || `Photo ${index + 1}`}
                  className='w-full h-full object-cover'
                />
                {/* Cover badge */}
                {item.is_cover && (
                  <div className='absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs flex items-center gap-1'>
                    <Star className='h-3 w-3 fill-current' />
                    {t('gallery.profilePhoto')}
                  </div>
                )}
                {/* Overlay on hover */}
                <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                  {!item.is_cover && (
                    <button
                      onClick={() => setCoverMutation.mutate(item.id)}
                      disabled={setCoverMutation.isPending}
                      className='p-2 bg-primary hover:bg-primary/80 text-primary-foreground transition-colors'
                      title={t('gallery.setAsProfile')}
                    >
                      <Star className='h-5 w-5' />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      // Prevent deletion of cover if it's the only image
                      if (item.is_cover && items.length === 1) {
                        toast.error(t('gallery.cannotDeleteOnlyCover', 'Cannot delete the only image. A gallery must always have a cover photo.'));
                        return;
                      }
                      setDeleteConfirm({
                        id: item.id,
                        isCover: item.is_cover,
                      });
                    }}
                    className='p-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground transition-colors'
                    title={t('buttons.delete')}
                  >
                    <Trash2 className='h-5 w-5' />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </FmCommonCard>

      {/* Delete confirmation */}
      <FmCommonConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title={deleteConfirm?.isCover ? t('gallery.deleteCoverPhoto', 'Delete cover photo?') : t('gallery.deletePhoto')}
        description={
          deleteConfirm?.isCover
            ? t('gallery.deleteCoverPhotoConfirm', 'This is the current cover photo. If you delete it, another photo will automatically be set as the new cover. This action cannot be undone.')
            : t('gallery.deletePhotoConfirm')
        }
        confirmText={t('buttons.delete')}
        onConfirm={() => {
          if (deleteConfirm) deleteItemMutation.mutate(deleteConfirm.id);
        }}
        variant='destructive'
        isLoading={deleteItemMutation.isPending}
      />
    </div>
  );
}
