/**
 * VenueMediaGrid
 *
 * Media grid with drag-and-drop upload functionality for venue galleries.
 * Displays uploaded items and upload placeholders.
 */

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, Upload } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { VenueMediaItemCard } from './VenueMediaItemCard';
import type { ResolvedMediaItem } from '@/features/media/types';
import { cn } from '@/shared';

interface VenueMediaGridProps {
  items: ResolvedMediaItem[];
  isLoading: boolean;
  uploading: boolean;
  uploadingCount: number;
  onUpload: (files: FileList | null) => void;
  onSetCover: (itemId: string) => void;
  onEditItem: (item: ResolvedMediaItem) => void;
  onDeleteItem: (item: ResolvedMediaItem) => void;
}

export const VenueMediaGrid = ({
  items,
  isLoading,
  uploading,
  uploadingCount,
  onUpload,
  onSetCover,
  onEditItem,
  onDeleteItem,
}: VenueMediaGridProps) => {
  const { t } = useTranslation('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      onUpload(e.dataTransfer.files);
    },
    [onUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpload(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
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
      <input
        ref={fileInputRef}
        type='file'
        multiple
        accept='image/*,video/*'
        className='hidden'
        onChange={handleFileChange}
      />

      {isLoading ? (
        <div className='h-[200px] flex items-center justify-center'>
          <FmCommonLoadingSpinner />
        </div>
      ) : items.length === 0 && uploadingCount === 0 ? (
        /* Empty state with upload prompt */
        <div className='h-[200px] flex flex-col items-center justify-center gap-3 text-muted-foreground'>
          <Upload className='w-8 h-8' />
          <p className='text-sm'>{t('venueGallery.dropFiles', 'Drop files here or click to upload')}</p>
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
        /* Grid with items */
        <div className='p-2'>
          {/* Upload button */}
          <div className='mb-3 flex justify-end'>
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

            {/* Media items */}
            {items.map(item => (
              <VenueMediaItemCard
                key={item.id}
                item={item}
                onSetCover={onSetCover}
                onEdit={onEditItem}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
