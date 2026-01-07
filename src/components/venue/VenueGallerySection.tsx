/**
 * VenueGallerySection
 *
 * Gallery management component specifically for venues.
 * Shows only galleries owned by the venue and ensures a default gallery exists.
 *
 * Refactored to use:
 * - useVenueGallery hook for all data and operations
 * - VenueMediaGrid for the media display
 * - EditMediaDialog for editing items
 * - CreateGalleryDialog for creating galleries
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, FolderPlus, Pencil, Check, X, FolderOpen } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
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
import { useVenueGallery } from './hooks/useVenueGallery';
import { VenueMediaGrid } from './VenueMediaGrid';
import { EditMediaDialog } from './dialogs/EditMediaDialog';
import { CreateGalleryDialog } from './dialogs/CreateGalleryDialog';
import type { ResolvedMediaItem } from '@/features/media/types';
import { toast } from 'sonner';

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

  // Use the gallery hook
  const { state, actions, uploadState } = useVenueGallery({
    venueId,
    venueName,
    onHeroImageChange,
  });

  // UI State
  const [showCreateGallery, setShowCreateGallery] = useState(false);
  const [editingItem, setEditingItem] = useState<ResolvedMediaItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'gallery' | 'item';
    id: string;
    name: string;
    isDefault?: boolean;
    isCover?: boolean;
  } | null>(null);

  // Gallery name editing state
  const [isEditingGalleryName, setIsEditingGalleryName] = useState(false);
  const [editedGalleryName, setEditedGalleryName] = useState('');
  const [isSavingGalleryName, setIsSavingGalleryName] = useState(false);

  // Reset gallery name edit state when gallery changes
  useEffect(() => {
    setIsEditingGalleryName(false);
    setEditedGalleryName(state.selectedGallery?.name || '');
  }, [state.selectedGallery?.id]);

  // Handlers
  const handleSaveGalleryName = async () => {
    if (!editedGalleryName.trim()) return;
    setIsSavingGalleryName(true);
    try {
      await actions.updateGalleryName(editedGalleryName);
      setIsEditingGalleryName(false);
    } catch {
      toast.error(t('venueGallery.updateFailed', 'Failed to update gallery'));
    } finally {
      setIsSavingGalleryName(false);
    }
  };

  const handleCancelGalleryNameEdit = () => {
    setIsEditingGalleryName(false);
    setEditedGalleryName(state.selectedGallery?.name || '');
  };

  const handleCreateGallery = async (name: string) => {
    try {
      await actions.createGallery(name);
    } catch {
      toast.error(t('venueGallery.createFailed', 'Failed to create gallery'));
    }
  };

  const handleDeleteGallery = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'gallery') return;
    try {
      await actions.deleteGallery(deleteConfirm.id);
    } catch {
      toast.error(t('venueGallery.deleteFailed', 'Failed to delete gallery'));
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleDeleteMedia = async () => {
    if (!deleteConfirm || deleteConfirm.type !== 'item') return;
    try {
      await actions.deleteMediaItem(deleteConfirm.id);
    } catch {
      toast.error(t('venueGallery.deleteMediaFailed', 'Failed to delete media'));
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleSaveMediaEdit = async (data: {
    alt_text: string | null;
    title: string | null;
    description: string | null;
    creator: string | null;
    year: number | null;
  }) => {
    if (!editingItem) return;
    try {
      await actions.updateMediaItem(editingItem.id, data);
      setEditingItem(null);
    } catch {
      toast.error(t('venueGallery.updateMediaFailed', 'Failed to update media'));
    }
  };

  const handleSetCover = async (itemId: string) => {
    try {
      await actions.setCoverImage(itemId);
    } catch {
      toast.error(t('venueGallery.setCoverFailed', 'Failed to set cover image'));
    }
  };

  if (state.galleriesLoading) {
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
            value={state.selectedGalleryId || ''}
            onValueChange={state.setSelectedGalleryId}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder={t('venueGallery.selectGallery', 'Select a gallery')}>
                {state.selectedGallery && (
                  <span className='flex items-center gap-2'>
                    <FolderOpen className='h-4 w-4' />
                    {state.selectedGallery.name}
                    {state.selectedGallery.is_default && (
                      <span className='text-xs bg-fm-gold/20 text-fm-gold px-1.5 py-0.5'>
                        {t('venueGallery.default', 'Default')}
                      </span>
                    )}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {state.galleries.map(gallery => (
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

        {state.selectedGallery && !state.selectedGallery.is_default && (
          <FmCommonButton
            variant='destructive'
            size='sm'
            onClick={() =>
              setDeleteConfirm({
                type: 'gallery',
                id: state.selectedGallery!.id,
                name: state.selectedGallery!.name,
                isDefault: state.selectedGallery!.is_default,
              })
            }
            className='flex-shrink-0'
          >
            <Trash2 className='w-4 h-4' />
          </FmCommonButton>
        )}
      </div>

      {/* Gallery info */}
      {state.selectedGallery && (
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
                <span className='text-sm font-medium'>{state.selectedGallery.name}</span>
                <FmCommonIconButton
                  icon={Pencil}
                  size='sm'
                  variant='secondary'
                  tooltip={t('venueGallery.renameGallery', 'Rename gallery')}
                  onClick={() => {
                    setEditedGalleryName(state.selectedGallery?.name || '');
                    setIsEditingGalleryName(true);
                  }}
                />
              </>
            )}
          </div>

          {/* Default gallery info */}
          {state.selectedGallery.is_default && (
            <p className='text-xs text-muted-foreground'>
              {t(
                'venueGallery.defaultGalleryInfo',
                'This is your default gallery. The cover image will be used as the venue hero image.'
              )}
            </p>
          )}

          {/* Item count */}
          <div className='text-xs text-muted-foreground'>
            <span>{state.items.length} {t('venueGallery.items', 'items')}</span>
          </div>
        </div>
      )}

      {/* Media Grid */}
      {state.selectedGallery ? (
        <VenueMediaGrid
          items={state.items}
          isLoading={state.itemsLoading}
          uploading={uploadState.uploading}
          uploadingCount={uploadState.uploadingCount}
          onUpload={actions.uploadFiles}
          onSetCover={handleSetCover}
          onEditItem={setEditingItem}
          onDeleteItem={item => {
            // Prevent deletion of cover if it's the only image
            if (item.is_cover && state.items.length === 1) {
              toast.error(t('venueGallery.cannotDeleteOnlyCover', 'Cannot delete the only image. A gallery must always have a cover photo.'));
              return;
            }
            setDeleteConfirm({
              type: 'item',
              id: item.id,
              name: item.title || 'this item',
              isCover: item.is_cover,
            });
          }}
        />
      ) : (
        <div className='h-[200px] border border-dashed border-white/20 flex items-center justify-center text-muted-foreground'>
          <p className='text-sm'>{t('venueGallery.noGallerySelected', 'Select a gallery to manage media')}</p>
        </div>
      )}

      {/* Edit Media Dialog */}
      <EditMediaDialog
        open={!!editingItem}
        onOpenChange={open => !open && setEditingItem(null)}
        item={editingItem}
        onSave={handleSaveMediaEdit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirm?.type === 'gallery'
                ? t('venueGallery.deleteGalleryTitle', 'Delete gallery?')
                : deleteConfirm?.isCover
                  ? t('venueGallery.deleteCoverTitle', 'Delete cover photo?')
                  : t('venueGallery.deleteMediaTitle', 'Delete media?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'gallery'
                ? t(
                    'venueGallery.deleteGalleryDescription',
                    `This will delete the gallery "${deleteConfirm?.name}" and all its media items. This action cannot be undone.`
                  )
                : deleteConfirm?.isCover
                  ? t(
                      'venueGallery.deleteCoverDescription',
                      'This is the current cover photo. If you delete it, another photo will automatically be set as the new cover. This action cannot be undone.'
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
      <CreateGalleryDialog
        open={showCreateGallery}
        onOpenChange={setShowCreateGallery}
        onCreate={handleCreateGallery}
      />
    </div>
  );
};
