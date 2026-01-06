/**
 * VenueGallerySection
 *
 * Gallery management component specifically for venues.
 * Shows only galleries owned by the venue and ensures a default gallery exists.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ImagePlus,
  Trash2,
  Edit,
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  FolderPlus,
  Star,
  Pencil,
  Check,
  X,
  FolderOpen,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getImageUrl } from '@/shared/utils/imageUtils';
import { logger } from '@/shared/services/logger';
import { toast } from 'sonner';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/common/shadcn/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import type { ResolvedMediaItem, MediaType, MediaGallery, MediaItem } from '@/features/media/types';
import { cn } from '@/shared';

const MEDIA_TYPE_ICONS: Record<MediaType, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
};

interface VenueGallerySectionProps {
  venueId: string;
  venueName: string;
  onHeroImageChange?: (imageUrl: string | null) => void;
}

export const VenueGallerySection = ({
  venueId,
  venueName,
  onHeroImageChange,
}: VenueGallerySectionProps) => {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected gallery state
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);

  // UI State
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ResolvedMediaItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'gallery' | 'item';
    id: string;
    name: string;
    isDefault?: boolean;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Create gallery dialog state
  const [showCreateGallery, setShowCreateGallery] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Gallery name editing state
  const [isEditingGalleryName, setIsEditingGalleryName] = useState(false);
  const [editedGalleryName, setEditedGalleryName] = useState('');
  const [isSavingGalleryName, setIsSavingGalleryName] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    alt_text: '',
    title: '',
    description: '',
    creator: '',
    year: '',
  });

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
          source: 'VenueGallerySection',
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
          source: 'VenueGallerySection',
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
          source: 'VenueGallerySection',
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

  // Reset gallery name edit state when gallery changes
  useEffect(() => {
    setIsEditingGalleryName(false);
    setEditedGalleryName(selectedGallery?.name || '');
  }, [selectedGallery?.id]);

  // Notify parent when cover image changes
  useEffect(() => {
    if (selectedGallery?.is_default && onHeroImageChange) {
      const coverItem = items.find(item => item.is_cover);
      onHeroImageChange(coverItem?.url || null);
    }
  }, [items, selectedGallery?.is_default, onHeroImageChange]);

  // Create gallery
  const handleCreateGallery = async () => {
    if (!newGalleryName) return;

    setIsCreating(true);
    try {
      const slug = `venue-${venueId}-${newGalleryName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')}`;

      const { data, error } = await (supabase as any)
        .from('media_galleries')
        .insert({
          slug,
          name: newGalleryName,
          venue_id: venueId,
          is_default: false,
          allowed_types: ['image'],
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(t('venueGallery.galleryCreated', 'Gallery created'));
      queryClient.invalidateQueries({ queryKey: ['venue-galleries', venueId] });
      setShowCreateGallery(false);
      setNewGalleryName('');
      setSelectedGalleryId(data.id);
    } catch (error) {
      logger.error('Failed to create gallery', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'VenueGallerySection',
      });
      toast.error(t('venueGallery.createFailed', 'Failed to create gallery'));
    } finally {
      setIsCreating(false);
    }
  };

  // Update gallery name
  const handleSaveGalleryName = async () => {
    if (!selectedGallery || !editedGalleryName.trim()) return;

    setIsSavingGalleryName(true);
    try {
      const { error } = await (supabase as any)
        .from('media_galleries')
        .update({ name: editedGalleryName.trim() })
        .eq('id', selectedGallery.id);

      if (error) throw error;

      toast.success(t('venueGallery.galleryUpdated', 'Gallery updated'));
      queryClient.invalidateQueries({ queryKey: ['venue-galleries', venueId] });
      setIsEditingGalleryName(false);
    } catch (error) {
      logger.error('Failed to update gallery', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'VenueGallerySection',
      });
      toast.error(t('venueGallery.updateFailed', 'Failed to update gallery'));
    } finally {
      setIsSavingGalleryName(false);
    }
  };

  // Delete gallery
  const handleDeleteGallery = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'gallery') return;

    try {
      const { error } = await (supabase as any)
        .from('media_galleries')
        .delete()
        .eq('id', deleteConfirm.id);

      if (error) throw error;

      toast.success(t('venueGallery.galleryDeleted', 'Gallery deleted'));
      queryClient.invalidateQueries({ queryKey: ['venue-galleries', venueId] });
      setDeleteConfirm(null);
      if (selectedGalleryId === deleteConfirm.id) {
        setSelectedGalleryId(null);
      }
    } catch (error) {
      logger.error('Failed to delete gallery', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'VenueGallerySection',
      });
      toast.error(t('venueGallery.deleteFailed', 'Failed to delete gallery'));
    }
  };

  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || !selectedGalleryId) return;

      const fileArray = Array.from(files);
      setUploading(true);
      setUploadingCount(fileArray.length);

      try {
        for (const file of fileArray) {
          // Upload file
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
          source: 'VenueGallerySection',
        });
        toast.error(t('venueGallery.uploadFailed', 'Failed to upload file'));
      } finally {
        setUploading(false);
        setUploadingCount(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [selectedGalleryId, venueId, queryClient, t]
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Open edit modal
  const openEditModal = (item: ResolvedMediaItem) => {
    setEditingItem(item);
    setEditForm({
      alt_text: item.alt_text || '',
      title: item.title || '',
      description: item.description || '',
      creator: item.creator || '',
      year: item.year?.toString() || '',
    });
    setShowEditItem(true);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      const { error } = await (supabase as any)
        .from('media_items')
        .update({
          alt_text: editForm.alt_text || null,
          title: editForm.title || null,
          description: editForm.description || null,
          creator: editForm.creator || null,
          year: editForm.year ? parseInt(editForm.year) : null,
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast.success(t('venueGallery.mediaUpdated', 'Media updated'));
      queryClient.invalidateQueries({ queryKey: ['venue-gallery-items', selectedGalleryId] });
      setShowEditItem(false);
      setEditingItem(null);
    } catch (error) {
      logger.error('Failed to update media', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'VenueGallerySection',
      });
      toast.error(t('venueGallery.updateMediaFailed', 'Failed to update media'));
    }
  };

  // Delete media item
  const handleDeleteMedia = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'item') return;

    try {
      const { error } = await (supabase as any)
        .from('media_items')
        .delete()
        .eq('id', deleteConfirm.id);

      if (error) throw error;

      toast.success(t('venueGallery.mediaDeleted', 'Media deleted'));
      queryClient.invalidateQueries({ queryKey: ['venue-gallery-items', selectedGalleryId] });
      setDeleteConfirm(null);
    } catch (error) {
      logger.error('Failed to delete media', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'VenueGallerySection',
      });
      toast.error(t('venueGallery.deleteMediaFailed', 'Failed to delete media'));
    }
  };

  // Set cover item
  const handleSetCover = async (itemId: string) => {
    if (!selectedGalleryId) return;

    try {
      // Unset all is_cover in this gallery
      const { error: unsetError } = await (supabase as any)
        .from('media_items')
        .update({ is_cover: false })
        .eq('gallery_id', selectedGalleryId);

      if (unsetError) throw unsetError;

      // Set this item as cover
      const { error: setError } = await (supabase as any)
        .from('media_items')
        .update({ is_cover: true })
        .eq('id', itemId);

      if (setError) throw setError;

      toast.success(t('venueGallery.coverSet', 'Cover image set'));
      queryClient.invalidateQueries({ queryKey: ['venue-gallery-items', selectedGalleryId] });
    } catch (error) {
      logger.error('Failed to set cover', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'VenueGallerySection',
      });
      toast.error(t('venueGallery.setCoverFailed', 'Failed to set cover image'));
    }
  };

  const handleCancelGalleryNameEdit = () => {
    setIsEditingGalleryName(false);
    setEditedGalleryName(selectedGallery?.name || '');
  };

  const startEditingGalleryName = () => {
    setEditedGalleryName(selectedGallery?.name || '');
    setIsEditingGalleryName(true);
  };

  if (galleriesLoading) {
    return (
      <div className='h-[200px] flex items-center justify-center'>
        <FmCommonLoadingSpinner />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header with gallery selector */}
      <div className='flex items-center gap-2'>
        <div className='flex-1'>
          <Select
            value={selectedGalleryId || ''}
            onValueChange={setSelectedGalleryId}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder={t('venueGallery.selectGallery', 'Select a gallery')}>
                {selectedGallery && (
                  <span className='flex items-center gap-2'>
                    <FolderOpen className='h-4 w-4' />
                    {selectedGallery.name}
                    {selectedGallery.is_default && (
                      <span className='text-xs bg-fm-gold/20 text-fm-gold px-1.5 py-0.5'>
                        {t('venueGallery.default', 'Default')}
                      </span>
                    )}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {galleries.map(gallery => (
                <SelectItem key={gallery.id} value={gallery.id}>
                  <span className='flex items-center gap-2'>
                    <FolderOpen className='h-4 w-4' />
                    {gallery.name}
                    {gallery.is_default && (
                      <span className='text-xs bg-fm-gold/20 text-fm-gold px-1.5 py-0.5 ml-2'>
                        {t('venueGallery.default', 'Default')}
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FmCommonIconButton
          icon={FolderPlus}
          variant='secondary'
          tooltip={t('venueGallery.newGallery', 'New gallery')}
          onClick={() => setShowCreateGallery(true)}
        />

        {selectedGallery && !selectedGallery.is_default && (
          <FmCommonButton
            variant='destructive'
            size='sm'
            onClick={() =>
              setDeleteConfirm({
                type: 'gallery',
                id: selectedGallery.id,
                name: selectedGallery.name,
                isDefault: selectedGallery.is_default,
              })
            }
            className='flex-shrink-0'
          >
            <Trash2 className='w-4 h-4' />
          </FmCommonButton>
        )}
      </div>

      {/* Gallery info */}
      {selectedGallery && (
        <div className='space-y-2'>
          {/* Gallery name with edit capability */}
          <div className='flex items-center gap-2'>
            {isEditingGalleryName ? (
              <div className='flex items-center gap-2 flex-1'>
                <input
                  type='text'
                  value={editedGalleryName}
                  onChange={e => setEditedGalleryName(e.target.value)}
                  className='flex-1 bg-white/5 border border-white/20 px-2 py-1 text-sm focus:border-fm-gold focus:outline-none'
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveGalleryName();
                    if (e.key === 'Escape') handleCancelGalleryNameEdit();
                  }}
                />
                <FmCommonIconButton
                  icon={Check}
                  size='sm'
                  variant='gold'
                  tooltip={t('buttons.save', 'Save')}
                  onClick={handleSaveGalleryName}
                  disabled={isSavingGalleryName || !editedGalleryName.trim()}
                />
                <FmCommonIconButton
                  icon={X}
                  size='sm'
                  variant='secondary'
                  tooltip={t('buttons.cancel', 'Cancel')}
                  onClick={handleCancelGalleryNameEdit}
                  disabled={isSavingGalleryName}
                />
              </div>
            ) : (
              <>
                <span className='text-sm font-medium'>{selectedGallery.name}</span>
                <FmCommonIconButton
                  icon={Pencil}
                  size='sm'
                  variant='secondary'
                  tooltip={t('venueGallery.renameGallery', 'Rename gallery')}
                  onClick={startEditingGalleryName}
                />
              </>
            )}
          </div>

          {/* Default gallery info */}
          {selectedGallery.is_default && (
            <p className='text-xs text-muted-foreground'>
              {t(
                'venueGallery.defaultGalleryInfo',
                'This is your default gallery. The cover image will be used as the venue hero image.'
              )}
            </p>
          )}

          {/* Item count */}
          <div className='text-xs text-muted-foreground'>
            <span>{items.length} {t('venueGallery.items', 'items')}</span>
          </div>
        </div>
      )}

      {/* Upload area / Media grid */}
      {selectedGallery ? (
        <div
          className={cn(
            'min-h-[200px] border border-dashed transition-colors',
            isDragging
              ? 'border-fm-gold bg-fm-gold/5'
              : 'border-white/20 hover:border-white/30'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {itemsLoading ? (
            <div className='h-[200px] flex items-center justify-center'>
              <FmCommonLoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <div className='h-[200px] flex flex-col items-center justify-center gap-3 text-muted-foreground'>
              <Upload className='w-8 h-8' />
              <p className='text-sm'>{t('venueGallery.dropFiles', 'Drop files here or click to upload')}</p>
              <input
                ref={fileInputRef}
                type='file'
                multiple
                accept='image/*,video/*'
                className='hidden'
                onChange={e => handleFileUpload(e.target.files)}
              />
              <FmCommonButton
                variant='secondary'
                size='sm'
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <FmCommonLoadingSpinner size='sm' />
                ) : (
                  <>
                    <ImagePlus className='w-4 h-4 mr-2' />
                    {t('venueGallery.selectFiles', 'Select files')}
                  </>
                )}
              </FmCommonButton>
            </div>
          ) : (
            <div className='p-2'>
              {/* Upload button */}
              <div className='mb-3 flex justify-end'>
                <input
                  ref={fileInputRef}
                  type='file'
                  multiple
                  accept='image/*,video/*'
                  className='hidden'
                  onChange={e => handleFileUpload(e.target.files)}
                />
                <FmCommonButton
                  variant='secondary'
                  size='sm'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <FmCommonLoadingSpinner size='sm' />
                  ) : (
                    <>
                      <ImagePlus className='w-4 h-4 mr-2' />
                      {t('venueGallery.addMedia', 'Add media')}
                    </>
                  )}
                </FmCommonButton>
              </div>

              {/* Media grid */}
              <div className='grid grid-cols-3 gap-2'>
                {/* Upload placeholders */}
                {uploadingCount > 0 &&
                  Array.from({ length: uploadingCount }).map((_, index) => (
                    <div
                      key={`uploading-${index}`}
                      className='relative aspect-square bg-black/40 border border-fm-gold/30 overflow-hidden flex items-center justify-center'
                    >
                      <div className='flex flex-col items-center gap-2'>
                        <FmCommonLoadingSpinner size='md' />
                        <span className='text-xs text-muted-foreground'>
                          {t('venueGallery.uploading', 'Uploading...')}
                        </span>
                      </div>
                    </div>
                  ))}
                {items.map(item => {
                  const TypeIcon = MEDIA_TYPE_ICONS[item.media_type];
                  const isCover = item.is_cover;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'group relative aspect-square bg-black/40 border overflow-hidden',
                        isCover ? 'border-fm-gold border-2' : 'border-white/10'
                      )}
                    >
                      {/* Thumbnail */}
                      {item.media_type === 'image' ? (
                        <ImageWithSkeleton
                          src={item.url}
                          alt={item.alt_text || ''}
                          className='w-full h-full object-cover'
                          skeletonClassName='bg-black/60'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center bg-black/60'>
                          <TypeIcon className='w-8 h-8 text-muted-foreground' />
                        </div>
                      )}

                      {/* Overlay on hover */}
                      <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1'>
                        <FmCommonIconButton
                          icon={Star}
                          size='sm'
                          variant={isCover ? 'gold' : 'default'}
                          tooltip={isCover ? t('venueGallery.coverImage', 'Cover image') : t('venueGallery.setAsCover', 'Set as cover')}
                          onClick={() => handleSetCover(item.id)}
                        />
                        <FmCommonIconButton
                          icon={Edit}
                          size='sm'
                          variant='default'
                          tooltip={t('buttons.edit', 'Edit')}
                          onClick={() => openEditModal(item)}
                        />
                        <FmCommonIconButton
                          icon={Trash2}
                          size='sm'
                          variant='destructive'
                          tooltip={t('buttons.delete', 'Delete')}
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'item',
                              id: item.id,
                              name: item.title || 'this item',
                            })
                          }
                        />
                      </div>

                      {/* Order indicator */}
                      <div className='absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 text-xs'>
                        {item.display_order + 1}
                      </div>

                      {/* Cover badge */}
                      {isCover && (
                        <div className='absolute top-1 right-1 bg-fm-gold text-black px-1.5 py-0.5 flex items-center gap-1'>
                          <Star className='w-3 h-3 fill-current' />
                          <span className='text-[10px] font-medium'>
                            {t('venueGallery.cover', 'Cover')}
                          </span>
                        </div>
                      )}

                      {/* Type badge */}
                      {item.media_type !== 'image' && !isCover && (
                        <div className='absolute top-1 right-1 bg-black/70 px-1.5 py-0.5'>
                          <TypeIcon className='w-3 h-3' />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className='h-[200px] border border-dashed border-white/20 flex items-center justify-center text-muted-foreground'>
          <p className='text-sm'>{t('venueGallery.noGallerySelected', 'Select a gallery to manage media')}</p>
        </div>
      )}

      {/* Edit Item Dialog */}
      <Dialog open={showEditItem} onOpenChange={setShowEditItem}>
        <DialogContent className='max-h-[90vh] flex flex-col'>
          <DialogHeader>
            <DialogTitle>{t('venueGallery.editMedia', 'Edit media')}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4 overflow-y-auto flex-1'>
            {editingItem && editingItem.media_type === 'image' && (
              <div className='aspect-video bg-black/40 overflow-hidden mb-4'>
                <img
                  src={editingItem.url}
                  alt={editingItem.alt_text || ''}
                  className='w-full h-full object-contain'
                />
              </div>
            )}
            <FmCommonTextField
              label={t('venueGallery.title', 'Title')}
              value={editForm.title}
              onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('venueGallery.titlePlaceholder', 'Photo title')}
            />
            <FmCommonTextField
              label={t('venueGallery.altText', 'Alt text')}
              value={editForm.alt_text}
              onChange={e => setEditForm(prev => ({ ...prev, alt_text: e.target.value }))}
              placeholder={t('venueGallery.altTextPlaceholder', 'Description for accessibility')}
            />
            <FmCommonTextField
              label={t('venueGallery.creator', 'Creator')}
              value={editForm.creator}
              onChange={e => setEditForm(prev => ({ ...prev, creator: e.target.value }))}
              placeholder={t('venueGallery.creatorPlaceholder', 'Photographer or creator name')}
            />
            <FmCommonTextField
              label={t('venueGallery.year', 'Year')}
              value={editForm.year}
              onChange={e => setEditForm(prev => ({ ...prev, year: e.target.value }))}
              placeholder='2024'
              type='number'
            />
            <FmCommonTextField
              label={t('venueGallery.description', 'Description')}
              value={editForm.description}
              onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('venueGallery.descriptionPlaceholder', 'Additional details')}
            />
          </div>
          <DialogFooter>
            <FmCommonButton variant='secondary' onClick={() => setShowEditItem(false)}>
              {t('buttons.cancel', 'Cancel')}
            </FmCommonButton>
            <FmCommonButton variant='gold' onClick={handleSaveEdit}>
              {t('buttons.save', 'Save')}
            </FmCommonButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirm?.type === 'gallery'
                ? t('venueGallery.deleteGalleryTitle', 'Delete gallery?')
                : t('venueGallery.deleteMediaTitle', 'Delete media?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'gallery'
                ? t(
                    'venueGallery.deleteGalleryDescription',
                    `This will delete the gallery "${deleteConfirm?.name}" and all its media items. This action cannot be undone.`
                  )
                : t(
                    'venueGallery.deleteMediaDescription',
                    `This will permanently delete "${deleteConfirm?.name}". This action cannot be undone.`
                  )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('buttons.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteConfirm?.type === 'gallery' ? handleDeleteGallery : handleDeleteMedia}
              className='bg-fm-danger hover:bg-fm-danger/90'
            >
              {t('buttons.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Gallery Dialog */}
      <Dialog open={showCreateGallery} onOpenChange={setShowCreateGallery}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FolderPlus className='w-5 h-5' />
              {t('venueGallery.createGallery', 'Create gallery')}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <FmCommonTextField
              label={t('venueGallery.galleryName', 'Name')}
              value={newGalleryName}
              onChange={e => setNewGalleryName(e.target.value)}
              placeholder={t('venueGallery.galleryNamePlaceholder', 'Event Photos')}
              autoFocus
            />
          </div>
          <DialogFooter>
            <FmCommonButton
              variant='secondary'
              onClick={() => setShowCreateGallery(false)}
              disabled={isCreating}
            >
              {t('buttons.cancel', 'Cancel')}
            </FmCommonButton>
            <FmCommonButton
              variant='gold'
              onClick={handleCreateGallery}
              disabled={!newGalleryName || isCreating}
            >
              {isCreating ? (
                <>
                  <FmCommonLoadingSpinner size='sm' className='mr-2' />
                  {t('venueGallery.creating', 'Creating...')}
                </>
              ) : (
                t('buttons.create', 'Create')
              )}
            </FmCommonButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
