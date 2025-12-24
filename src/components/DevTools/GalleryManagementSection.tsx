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
  FolderPlus,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  Check,
} from 'lucide-react';
import { useGalleryManagement } from '@/features/media/hooks/useGalleryManagement';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
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
    galleries,
    galleriesLoading,
    selectedGallery,
    setSelectedGallery,
    items,
    itemsLoading,
    createGallery,
    deleteGallery,
    createMediaItem,
    updateMediaItem,
    deleteMediaItem,
    uploadFile,
  } = useGalleryManagement();

  // UI State
  const [showCreateGallery, setShowCreateGallery] = useState(false);
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
  const [isDragging, setIsDragging] = useState(false);

  // Form state
  const [newGalleryName, setNewGalleryName] = useState('');
  const [newGallerySlug, setNewGallerySlug] = useState('');

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

      setUploading(true);
      try {
        for (const file of Array.from(files)) {
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
        }
      } finally {
        setUploading(false);
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

  // Create gallery
  const handleCreateGallery = async () => {
    if (!newGalleryName || !newGallerySlug) return;

    const gallery = await createGallery({
      name: newGalleryName,
      slug: newGallerySlug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-'),
    });

    if (gallery) {
      setShowCreateGallery(false);
      setNewGalleryName('');
      setNewGallerySlug('');
      setSelectedGallery(gallery);
    }
  };

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className='flex-1 flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 hover:border-white/20 transition-colors text-left'>
              <span className='font-canela text-sm truncate'>
                {selectedGallery?.name || 'Select gallery'}
              </span>
              <ChevronDown className='w-4 h-4 text-muted-foreground ml-2 flex-shrink-0' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-56'>
            {galleriesLoading ? (
              <div className='p-2 text-center'>
                <FmCommonLoadingSpinner size='sm' />
              </div>
            ) : galleries.length === 0 ? (
              <div className='p-2 text-sm text-muted-foreground text-center'>
                No galleries
              </div>
            ) : (
              galleries.map(gallery => (
                <DropdownMenuItem
                  key={gallery.id}
                  onClick={() => setSelectedGallery(gallery)}
                  className='flex items-center justify-between'
                >
                  <span>{gallery.name}</span>
                  {selectedGallery?.id === gallery.id && (
                    <Check className='w-4 h-4 text-fm-gold' />
                  )}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <FmCommonButton
          variant='secondary'
          size='sm'
          onClick={() => setShowCreateGallery(true)}
          className='flex-shrink-0'
        >
          <FolderPlus className='w-4 h-4' />
        </FmCommonButton>

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
                {items.map(item => {
                  const TypeIcon = MEDIA_TYPE_ICONS[item.media_type];
                  return (
                    <div
                      key={item.id}
                      className='group relative aspect-square bg-black/40 border border-white/10 overflow-hidden'
                    >
                      {/* Thumbnail */}
                      {item.media_type === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.alt_text || ''}
                          className='w-full h-full object-cover'
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

      {/* Create Gallery Dialog */}
      <Dialog open={showCreateGallery} onOpenChange={setShowCreateGallery}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create gallery</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <FmCommonTextField
              label='Name'
              value={newGalleryName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setNewGalleryName(e.target.value);
                // Auto-generate slug from name
                setNewGallerySlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, '-')
                    .replace(/-+/g, '-')
                );
              }}
              placeholder='Artist Signup Carousel'
            />
            <FmCommonTextField
              label='Slug'
              value={newGallerySlug}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setNewGallerySlug(e.target.value)
              }
              placeholder='artist-signup-carousel'
              description='URL-safe identifier used in code'
            />
          </div>
          <DialogFooter>
            <FmCommonButton
              variant='secondary'
              onClick={() => setShowCreateGallery(false)}
            >
              Cancel
            </FmCommonButton>
            <FmCommonButton
              variant='gold'
              onClick={handleCreateGallery}
              disabled={!newGalleryName || !newGallerySlug}
            >
              Create
            </FmCommonButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditItem} onOpenChange={setShowEditItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit media</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
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

export default GalleryManagementSection;
