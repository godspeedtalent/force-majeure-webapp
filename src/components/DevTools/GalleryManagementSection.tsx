/**
 * GalleryManagementSection
 *
 * Admin UI for managing media galleries and items.
 * Allows creating galleries, uploading media, editing metadata, and reordering.
 */

import { useState, useCallback, useRef, ChangeEvent } from 'react';
import {
  ImagePlus,
  Trash2,
  Edit,
  Upload,
  Image as ImageIcon,
  Video,
  Music,
} from 'lucide-react';
import { useGalleryManagement } from '@/features/media/hooks/useGalleryManagement';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmGallerySelectDropdown } from '@/components/common/forms/FmGallerySelectDropdown';
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
import type { ResolvedMediaItem, MediaType } from '@/features/media/types';
import { cn } from '@/shared';

const MEDIA_TYPE_ICONS: Record<MediaType, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
};

export const GalleryManagementSection = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    selectedGallery,
    setSelectedGallery,
    items,
    itemsLoading,
    deleteGallery,
    createMediaItem,
    updateMediaItem,
    deleteMediaItem,
    uploadFile,
  } = useGalleryManagement();

  // UI State
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ResolvedMediaItem | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'gallery' | 'item';
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
      if (!files || !selectedGallery) return;

      const fileArray = Array.from(files);
      setUploading(true);
      setUploadingCount(fileArray.length);

      try {
        for (const file of fileArray) {
          const filePath = await uploadFile(file, selectedGallery.id);
          if (filePath) {
            await createMediaItem({
              gallery_id: selectedGallery.id,
              file_path: filePath,
              media_type: file.type.startsWith('video/')
                ? 'video'
                : file.type.startsWith('audio/')
                  ? 'audio'
                  : 'image',
              title: file.name.replace(/\.[^/.]+$/, ''),
            });
          }
          // Decrement count after each file completes
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
    [selectedGallery, uploadFile, createMediaItem]
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

    if (deleteConfirm.type === 'gallery') {
      await deleteGallery(deleteConfirm.id);
    } else {
      await deleteMediaItem(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className='space-y-4'>
      {/* Header with gallery selector */}
      <div className='flex items-center gap-2'>
        <FmGallerySelectDropdown
          value={selectedGallery}
          onChange={setSelectedGallery}
          showCreateOption={true}
          className='flex-1'
        />

        {selectedGallery && (
          <FmCommonButton
            variant='destructive'
            size='sm'
            onClick={() =>
              setDeleteConfirm({
                type: 'gallery',
                id: selectedGallery.id,
                name: selectedGallery.name,
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
        <div className='text-xs text-muted-foreground'>
          <span className='font-mono bg-white/5 px-1.5 py-0.5'>
            {selectedGallery.slug}
          </span>
          <span className='mx-2'>•</span>
          <span>{items.length} items</span>
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
              <p className='text-sm'>Drop files here or click to upload</p>
              <input
                ref={fileInputRef}
                type='file'
                multiple
                accept='image/*,video/*,audio/*'
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
                    Select files
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
                  accept='image/*,video/*,audio/*'
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
                      Add media
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
                        <span className='text-xs text-muted-foreground'>Uploading...</span>
                      </div>
                    </div>
                  ))}
                {items.map(item => {
                  const TypeIcon = MEDIA_TYPE_ICONS[item.media_type];
                  return (
                    <div
                      key={item.id}
                      className='group relative aspect-square bg-black/40 border border-white/10 overflow-hidden'
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
                      <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                        <button
                          onClick={() => openEditModal(item)}
                          className='p-2 bg-white/10 hover:bg-white/20 transition-colors'
                        >
                          <Edit className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'item',
                              id: item.id,
                              name: item.title || 'this item',
                            })
                          }
                          className='p-2 bg-white/10 hover:bg-fm-danger/50 transition-colors'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>

                      {/* Order indicator */}
                      <div className='absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 text-xs'>
                        {item.display_order + 1}
                      </div>

                      {/* Type badge */}
                      {item.media_type !== 'image' && (
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
          <p className='text-sm'>Select or create a gallery to manage media</p>
        </div>
      )}

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
            <AlertDialogTitle>
              Delete {deleteConfirm?.type === 'gallery' ? 'gallery' : 'media'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'gallery'
                ? `This will delete the gallery "${deleteConfirm.name}" and all its media items. This action cannot be undone.`
                : `This will permanently delete "${deleteConfirm?.name}". This action cannot be undone.`}
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
    </div>
  );
};
