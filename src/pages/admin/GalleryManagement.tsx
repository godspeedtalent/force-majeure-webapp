/**
 * GalleryManagement Page
 *
 * Dedicated page for managing a specific media gallery.
 * Can be accessed via direct URL with gallery slug, or from gallery carousel edit buttons.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Images, Trash2, Upload, Edit, ImagePlus, Image as ImageIcon, Video, Music, Download, Star } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
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
import { useGalleryManagement } from '@/features/media/hooks/useGalleryManagement';
import { useQuery } from '@tanstack/react-query';
import { supabase, cn, logger } from '@/shared';
import type { ResolvedMediaItem, MediaGallery, MediaType } from '@/features/media/types';
import { ChangeEvent, useCallback, useRef } from 'react';

const MEDIA_TYPE_ICONS: Record<MediaType, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
};

export default function GalleryManagement() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch gallery by slug
  const { data: gallery, isLoading: galleryLoading, error: galleryError } = useQuery({
    queryKey: ['gallery-by-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      // Use (supabase as any) since media_galleries isn't in generated types yet
      const { data, error } = await (supabase as any)
        .from('media_galleries')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        logger.error('Error fetching gallery by slug', {
          error: error.message,
          slug,
          source: 'GalleryManagement',
        });
        throw error;
      }
      return data as MediaGallery;
    },
    enabled: !!slug,
  });

  const {
    setSelectedGallery,
    items,
    itemsLoading,
    createMediaItem,
    updateMediaItem,
    deleteMediaItem,
    setCoverItem,
    uploadFile,
  } = useGalleryManagement();

  // Set the selected gallery when data loads
  useEffect(() => {
    if (gallery) {
      setSelectedGallery(gallery);
    }
  }, [gallery, setSelectedGallery]);

  // UI State
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ResolvedMediaItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'item';
    id: string;
    name: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    alt_text: '',
    title: '',
    description: '',
    creator: '',
    year: '',
  });

  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || !gallery) return;

      const fileArray = Array.from(files);
      setUploading(true);
      setUploadingCount(fileArray.length);

      try {
        for (const file of fileArray) {
          const filePath = await uploadFile(file, gallery.id);
          if (filePath) {
            await createMediaItem({
              gallery_id: gallery.id,
              file_path: filePath,
              media_type: file.type.startsWith('video/')
                ? 'video'
                : file.type.startsWith('audio/')
                  ? 'audio'
                  : 'image',
              title: file.name.replace(/\.[^/.]+$/, ''),
            });
          }
          setUploadingCount(prev => Math.max(0, prev - 1));
        }
      } finally {
        setUploading(false);
        setUploadingCount(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [gallery, uploadFile, createMediaItem]
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

    const success = await updateMediaItem(editingItem.id, {
      alt_text: editForm.alt_text || undefined,
      title: editForm.title || undefined,
      description: editForm.description || undefined,
      creator: editForm.creator || undefined,
      year: editForm.year ? parseInt(editForm.year) : undefined,
    });

    if (success) {
      setShowEditItem(false);
      setEditingItem(null);
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    await deleteMediaItem(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  if (galleryLoading) {
    return <FmCommonLoadingState fullScreen />;
  }

  if (galleryError || !gallery) {
    return (
      <Layout>
        <div className='container mx-auto pt-8 pb-8 px-4'>
          <div className='max-w-4xl mx-auto text-center'>
            <h1 className='text-2xl font-canela mb-4'>Gallery not found</h1>
            <p className='text-muted-foreground mb-6'>
              The gallery "{slug}" could not be found.
            </p>
            <FmCommonButton
              variant='default'
              onClick={() => navigate(-1)}
              className='gap-2'
            >
              <ArrowLeft className='w-4 h-4' />
              Go back
            </FmCommonButton>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='container mx-auto pt-8 pb-8 px-4'>
        <div className='max-w-6xl mx-auto'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-4'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => navigate(-1)}
                className='border-white/20 hover:bg-white/10'
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                {t('buttons.back')}
              </Button>
              <div>
                <h1 className='text-3xl font-canela flex items-center gap-3'>
                  <Images className='h-8 w-8 text-fm-gold' />
                  {gallery.name}
                </h1>
                <p className='text-muted-foreground mt-1'>
                  <span className='font-mono bg-white/5 px-1.5 py-0.5 text-sm'>
                    {gallery.slug}
                  </span>
                  <span className='mx-2'>•</span>
                  <span>{items.length} items</span>
                  {gallery.description && (
                    <>
                      <span className='mx-2'>•</span>
                      <span>{gallery.description}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className='h-px bg-gradient-to-r from-fm-gold/50 via-white/20 to-transparent mb-8 w-32'
          />

          {/* Upload area / Media grid */}
          <div
            className={cn(
              'min-h-[400px] border border-dashed transition-colors',
              isDragging
                ? 'border-fm-gold bg-fm-gold/5'
                : 'border-white/20 hover:border-white/30'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {itemsLoading ? (
              <div className='h-[400px] flex items-center justify-center'>
                <FmCommonLoadingSpinner />
              </div>
            ) : items.length === 0 ? (
              <div className='h-[400px] flex flex-col items-center justify-center gap-4 text-muted-foreground'>
                <Upload className='w-12 h-12' />
                <p className='text-lg'>Drop files here or click to upload</p>
                <p className='text-sm'>Supported: Images, Videos, Audio</p>
                <input
                  ref={fileInputRef}
                  type='file'
                  multiple
                  accept='image/*,video/*,audio/*'
                  className='hidden'
                  onChange={e => handleFileUpload(e.target.files)}
                />
                <FmCommonButton
                  variant='default'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className='gap-2'
                >
                  {uploading ? (
                    <FmCommonLoadingSpinner size='sm' />
                  ) : (
                    <>
                      <ImagePlus className='w-4 h-4' />
                      Select files
                    </>
                  )}
                </FmCommonButton>
              </div>
            ) : (
              <div className='p-4'>
                {/* Upload button */}
                <div className='mb-4 flex justify-end'>
                  <input
                    ref={fileInputRef}
                    type='file'
                    multiple
                    accept='image/*,video/*,audio/*'
                    className='hidden'
                    onChange={e => handleFileUpload(e.target.files)}
                  />
                  <FmCommonButton
                    variant='default'
                    size='sm'
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className='gap-2'
                  >
                    {uploading ? (
                      <FmCommonLoadingSpinner size='sm' />
                    ) : (
                      <>
                        <ImagePlus className='w-4 h-4' />
                        Add media
                      </>
                    )}
                  </FmCommonButton>
                </div>

                {/* Media grid */}
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
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
                            Uploading...
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
                            <TypeIcon className='w-10 h-10 text-muted-foreground' />
                          </div>
                        )}

                        {/* Overlay on hover */}
                        <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                          <FmCommonIconButton
                            icon={Star}
                            size='sm'
                            variant={isCover ? 'gold' : 'default'}
                            tooltip={isCover ? t('labels.coverImage') : t('buttons.setAsCover')}
                            onClick={() => setCoverItem(item.id)}
                          />
                          <FmCommonIconButton
                            icon={Edit}
                            size='sm'
                            variant='default'
                            tooltip={t('buttons.edit')}
                            onClick={() => openEditModal(item)}
                          />
                          <FmCommonIconButton
                            icon={Download}
                            size='sm'
                            variant='default'
                            tooltip={t('buttons.download')}
                            onClick={() => window.open(item.url, '_blank')}
                          />
                          <FmCommonIconButton
                            icon={Trash2}
                            size='sm'
                            variant='destructive'
                            tooltip={t('buttons.delete')}
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
                        <div className='absolute top-1 left-1 bg-black/70 px-2 py-0.5 text-xs'>
                          {item.display_order + 1}
                        </div>

                        {/* Cover badge */}
                        {isCover && (
                          <div className='absolute top-1 right-1 bg-fm-gold text-black px-1.5 py-0.5 flex items-center gap-1'>
                            <Star className='w-3 h-3 fill-current' />
                            <span className='text-[10px] font-medium'>Cover</span>
                          </div>
                        )}

                        {/* Type badge */}
                        {item.media_type !== 'image' && !isCover && (
                          <div className='absolute top-1 right-1 bg-black/70 px-1.5 py-0.5'>
                            <TypeIcon className='w-3 h-3' />
                          </div>
                        )}

                        {/* Title */}
                        {item.title && (
                          <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2'>
                            <p className='text-xs text-white/80 truncate'>
                              {item.title}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={showEditItem} onOpenChange={setShowEditItem}>
        <DialogContent className='max-h-[90vh] flex flex-col'>
          <DialogHeader>
            <DialogTitle>Edit media</DialogTitle>
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
              label='Title'
              value={editForm.title}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEditForm(prev => ({ ...prev, title: e.target.value }))
              }
              placeholder='Photo title'
            />
            <FmCommonTextField
              label='Alt text'
              value={editForm.alt_text}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEditForm(prev => ({ ...prev, alt_text: e.target.value }))
              }
              placeholder='Description for accessibility'
            />
            <FmCommonTextField
              label='Creator'
              value={editForm.creator}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEditForm(prev => ({ ...prev, creator: e.target.value }))
              }
              placeholder='Photographer or creator name'
            />
            <FmCommonTextField
              label='Year'
              value={editForm.year}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEditForm(prev => ({ ...prev, year: e.target.value }))
              }
              placeholder='2024'
              type='number'
            />
            <FmCommonTextField
              label='Description'
              value={editForm.description}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEditForm(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder='Additional details'
            />
          </div>
          <DialogFooter>
            <FmCommonButton
              variant='secondary'
              onClick={() => setShowEditItem(false)}
            >
              Cancel
            </FmCommonButton>
            <FmCommonButton variant='gold' onClick={handleSaveEdit}>
              Save
            </FmCommonButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete media?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteConfirm?.name}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className='bg-fm-danger hover:bg-fm-danger/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
