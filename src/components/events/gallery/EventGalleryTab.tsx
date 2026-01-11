/**
 * EventGalleryTab
 *
 * Gallery management tab for events, allowing photo uploads and hero image selection.
 * Similar to ArtistManageGalleryTab but with hero image prominence.
 */

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Image as ImageIcon, Star, ImagePlus } from 'lucide-react';
import { supabase, useFeatureFlagHelpers, FEATURE_FLAGS } from '@/shared';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { HeroImageFocalPoint } from '@/components/events/overview/HeroImageFocalPoint';
import { imageUploadService } from '@/shared';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import { cn } from '@/shared';

interface MediaItem {
  id: string;
  file_path: string;
  title: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  is_cover: boolean;
}

interface EventGalleryTabProps {
  eventId: string;
  eventTitle: string;
  galleryId: string | null;
  heroImage: string | null;
  heroImageFocalY: number | null;
}

export function EventGalleryTab({
  eventId,
  eventTitle,
  galleryId,
  heroImage,
  heroImageFocalY,
}: EventGalleryTabProps) {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const { isFeatureEnabled } = useFeatureFlagHelpers();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Fetch or create gallery
  const { data: gallery, isLoading: galleryLoading } = useQuery({
    queryKey: ['event-gallery', eventId],
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
    enabled: !!eventId,
  });

  // Fetch gallery items
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['event-gallery-items', gallery?.id],
    queryFn: async () => {
      if (!gallery?.id) return [];

      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .eq('gallery_id', gallery.id)
        .eq('is_active', true)
        .order('is_cover', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as MediaItem[];
    },
    enabled: !!gallery?.id,
  });

  // Create gallery mutation
  const createGalleryMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_event_gallery', {
        p_event_id: eventId,
        p_event_title: eventTitle,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(tToast('gallery.created'));
      queryClient.invalidateQueries({ queryKey: ['event-gallery', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
    onError: error => {
      handleError(error, { title: tToast('gallery.createFailed') });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const itemToDelete = items.find(i => i.id === itemId);
      const wasCover = itemToDelete?.is_cover;

      const { error } = await supabase
        .from('media_items')
        .update({ is_active: false })
        .eq('id', itemId);

      if (error) throw error;

      // If we deleted the cover/hero image, clear the event's hero_image
      if (wasCover) {
        await supabase.from('events').update({ hero_image: null }).eq('id', eventId);
      }
    },
    onSuccess: () => {
      toast.success(tToast('gallery.itemDeleted'));
      queryClient.invalidateQueries({ queryKey: ['event-gallery-items', gallery?.id] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setDeleteItemId(null);
    },
    onError: error => {
      handleError(error, { title: tToast('gallery.deleteItemFailed') });
    },
  });

  // Set cover/hero mutation
  const setCoverMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const item = items.find(i => i.id === itemId);
      if (!item || !gallery?.id) throw new Error('Item not found');

      // Unset current cover(s)
      await supabase.from('media_items').update({ is_cover: false }).eq('gallery_id', gallery.id);

      // Set new cover
      const { error: coverError } = await supabase
        .from('media_items')
        .update({ is_cover: true })
        .eq('id', itemId);

      if (coverError) throw coverError;

      // Update event's hero_image to match cover
      const { error: eventError } = await supabase
        .from('events')
        .update({ hero_image: item.file_path })
        .eq('id', eventId);

      if (eventError) throw eventError;
    },
    onSuccess: () => {
      toast.success(tToast('gallery.heroImageSet'));
      queryClient.invalidateQueries({ queryKey: ['event-gallery-items', gallery?.id] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
    onError: error => {
      handleError(error, { title: tToast('gallery.setHeroFailed') });
    },
  });

  // Update hero image focal point mutation
  const updateFocalPointMutation = useMutation({
    mutationFn: async (focalY: number) => {
      const { error } = await supabase
        .from('events')
        .update({ hero_image_focal_y: focalY })
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
    onError: error => {
      handleError(error, { title: tToast('gallery.focalPointUpdateFailed') });
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
      });

      // Create media item - first image becomes cover/hero
      const { error } = await supabase.from('media_items').insert({
        gallery_id: gallery.id,
        file_path: result.publicUrl,
        media_type: 'image' as const,
        display_order: items.length,
        is_active: true,
        is_cover: isFirstImage,
      });

      if (error) throw error;

      // If first image, also update event's hero_image
      if (isFirstImage) {
        await supabase.from('events').update({ hero_image: result.publicUrl }).eq('id', eventId);
      }

      toast.success(tToast('gallery.imageUploaded'));
      queryClient.invalidateQueries({ queryKey: ['event-gallery-items', gallery?.id] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
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

  // No gallery yet - show create option with hero image preview if exists
  if (!gallery) {
    return (
      <div className='space-y-6'>
        {/* Hero Image Preview (if exists from old upload) */}
        {heroImage && (
          <FmCommonCard size='lg' hoverable={false}>
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>{t('gallery.currentHeroImage')}</h3>
              <div className='relative aspect-video max-w-md overflow-hidden bg-black/20'>
                <img
                  src={heroImage}
                  alt={t('gallery.heroImage')}
                  className='w-full h-full object-cover'
                />
                <div className='absolute top-2 left-2 px-2 py-1 bg-fm-gold text-black text-xs flex items-center gap-1'>
                  <Star className='h-3 w-3 fill-current' />
                  {t('gallery.heroImage')}
                </div>
              </div>
              <p className='text-sm text-muted-foreground'>
                {t('gallery.heroImageWillBeIncluded')}
              </p>
            </div>
          </FmCommonCard>
        )}

        <FmCommonCard size='lg' hoverable={false}>
          <div className='text-center py-12'>
            <ImageIcon className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>{t('gallery.noGalleryYet')}</h3>
            <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
              {t('gallery.createEventGalleryDescription')}
            </p>
            <FmCommonButton
              onClick={() => createGalleryMutation.mutate()}
              disabled={createGalleryMutation.isPending}
            >
              {createGalleryMutation.isPending ? t('buttons.creating') : t('gallery.createGallery')}
            </FmCommonButton>
          </div>
        </FmCommonCard>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Hero Image Section */}
      <FmCommonCard size='lg' hoverable={false}>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-xl font-semibold'>{t('gallery.heroImage')}</h2>
            <p className='text-muted-foreground text-sm mt-1'>
              {t('gallery.heroImageDescription')}
            </p>
          </div>
        </div>

        {heroImage ? (
          <div className='space-y-4'>
            <div className='relative aspect-video max-w-2xl overflow-hidden bg-black/20'>
              <img
                src={heroImage}
                alt={t('gallery.heroImage')}
                className='w-full h-full object-cover'
              />
              <div className='absolute top-2 left-2 px-2 py-1 bg-fm-gold text-black text-xs flex items-center gap-1'>
                <Star className='h-3 w-3 fill-current' />
                {t('gallery.heroImage')}
              </div>
            </div>

            {/* Hero Image Focal Point */}
            {isFeatureEnabled(FEATURE_FLAGS.HERO_IMAGE_HORIZONTAL_CENTERING) && (
              <div className='max-w-2xl'>
                <HeroImageFocalPoint
                  imageUrl={heroImage}
                  focalY={heroImageFocalY ?? 50}
                  onChange={(y) => {
                    updateFocalPointMutation.mutate(y);
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className='border-2 border-dashed border-white/20 rounded-none p-8 text-center max-w-2xl'>
            <ImagePlus className='h-12 w-12 text-muted-foreground mx-auto mb-3' />
            <p className='text-muted-foreground'>{t('gallery.noHeroImageYet')}</p>
            <p className='text-muted-foreground text-sm mt-1'>
              {t('gallery.uploadPhotoToSetHero')}
            </p>
          </div>
        )}
      </FmCommonCard>

      {/* Gallery Photos */}
      <FmCommonCard size='lg' hoverable={false}>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-xl font-semibold'>{t('gallery.eventPhotos')}</h2>
            <p className='text-muted-foreground text-sm mt-1'>
              {t('gallery.eventPhotosDescription')}
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
                className={cn(
                  'group relative aspect-square overflow-hidden bg-black/20',
                  item.is_cover && 'ring-2 ring-fm-gold'
                )}
              >
                <img
                  src={item.file_path}
                  alt={item.title || `Photo ${index + 1}`}
                  className='w-full h-full object-cover'
                />
                {/* Cover/Hero badge */}
                {item.is_cover && (
                  <div className='absolute top-2 left-2 px-2 py-1 bg-fm-gold text-black text-xs flex items-center gap-1'>
                    <Star className='h-3 w-3 fill-current' />
                    {t('gallery.heroImage')}
                  </div>
                )}
                {/* Overlay on hover */}
                <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                  {!item.is_cover && (
                    <button
                      onClick={() => setCoverMutation.mutate(item.id)}
                      disabled={setCoverMutation.isPending}
                      className='p-2 bg-fm-gold hover:bg-fm-gold/80 text-black transition-colors'
                      title={t('gallery.setAsHero')}
                    >
                      <Star className='h-5 w-5' />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteItemId(item.id)}
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
        open={!!deleteItemId}
        onOpenChange={open => !open && setDeleteItemId(null)}
        title={t('gallery.deletePhoto')}
        description={t('gallery.deletePhotoConfirm')}
        confirmText={t('buttons.delete')}
        onConfirm={() => {
          if (deleteItemId) deleteItemMutation.mutate(deleteItemId);
        }}
        variant='destructive'
        isLoading={deleteItemMutation.isPending}
      />
    </div>
  );
}