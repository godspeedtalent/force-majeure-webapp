import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/shared';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmI18nCommon } from '@/components/common/i18n';
import { imageUploadService } from '@/shared';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';

interface MediaItem {
  id: string;
  file_path: string;
  title: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
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
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Fetch or create gallery
  const { data: gallery, isLoading: galleryLoading } = useQuery({
    queryKey: ['artist-gallery', artistId],
    queryFn: async () => {
      // If artist already has a gallery, fetch it
      if (galleryId) {
        const { data, error } = await (supabase as any)
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
      
      const { data, error } = await (supabase as any)
        .from('media_items')
        .select('*')
        .eq('gallery_id', gallery.id)
        .eq('is_active', true)
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

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await (supabase as any)
        .from('media_items')
        .update({ is_active: false })
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(tToast('gallery.itemDeleted'));
      queryClient.invalidateQueries({ queryKey: ['artist-gallery-items', gallery?.id] });
      setDeleteItemId(null);
    },
    onError: (error) => {
      handleError(error, { title: tToast('gallery.deleteItemFailed') });
    },
  });

  const handleFileUpload = async (file: File) => {
    if (!gallery?.id) return;

    setIsUploading(true);
    try {
      const result = await imageUploadService.uploadImage({
        file,
        isPrimary: false,
      });

      // Create media item
      const { error } = await (supabase as any)
        .from('media_items')
        .insert({
          gallery_id: gallery.id,
          file_path: result.publicUrl,
          media_type: 'image',
          display_order: items.length,
          is_active: true,
        });

      if (error) throw error;

      toast.success(tToast('gallery.imageUploaded'));
      queryClient.invalidateQueries({ queryKey: ['artist-gallery-items', gallery?.id] });
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
                {/* Overlay on hover */}
                <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                  <button
                    onClick={() => setDeleteItemId(item.id)}
                    className='p-2 bg-red-600 hover:bg-red-700 text-white transition-colors'
                  >
                    <Trash2 className='h-5 w-5' />
                  </button>
                </div>
                {/* Order indicator */}
                <div className='absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs'>
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </FmCommonCard>

      {/* Delete confirmation */}
      <FmCommonConfirmDialog
        open={!!deleteItemId}
        onOpenChange={(open) => !open && setDeleteItemId(null)}
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
