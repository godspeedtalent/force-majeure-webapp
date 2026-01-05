/**
 * FmGalleryImageUpload
 *
 * A multi-image upload component for create forms.
 * Allows uploading multiple images, designating a cover image,
 * and reordering. Returns an array of uploaded image URLs.
 *
 * The first uploaded image is automatically set as cover.
 * Users can change the cover by clicking the star icon.
 */

import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ImageIcon, Star, Plus } from 'lucide-react';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { imageUploadService } from '@/shared';
import { toast } from 'sonner';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { showErrorToast } from '@/components/common/feedback/FmErrorToast';
import { cn } from '@/shared';
import { ROLES } from '@/shared/auth/permissions';

export interface GalleryImage {
  /** The uploaded image URL */
  url: string;
  /** Whether this is the cover/primary image */
  isCover: boolean;
}

interface FmGalleryImageUploadProps {
  /** Current gallery images */
  value: GalleryImage[];
  /** Callback when images change */
  onChange: (images: GalleryImage[]) => void;
  /** Label for the upload section */
  label?: string;
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Bucket to upload to */
  bucket?: string;
  /** Optional path prefix for uploads */
  pathPrefix?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback when upload state changes (for form submission control) */
  onUploadStateChange?: (isUploading: boolean) => void;
}

/**
 * FmGalleryImageUpload Component
 *
 * Multi-image upload component for entity creation forms.
 * Supports drag-and-drop, cover image selection, and image removal.
 */
export const FmGalleryImageUpload = ({
  value,
  onChange,
  label,
  maxImages = 10,
  bucket = 'artist-images',
  pathPrefix,
  className,
  onUploadStateChange,
}: FmGalleryImageUploadProps) => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { hasRole } = useUserPermissions();

  const isDeveloper = hasRole(ROLES.DEVELOPER) || hasRole(ROLES.ADMIN);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const remainingSlots = maxImages - value.length;

      if (remainingSlots <= 0) {
        toast.error(t('gallery.maxImagesReached'));
        return;
      }

      const filesToUpload = fileArray.slice(0, remainingSlots);
      if (filesToUpload.length < fileArray.length) {
        toast.warning(
          t('gallery.onlyUploadingCount', { count: filesToUpload.length })
        );
      }

      setIsUploading(true);
      setUploadingCount(filesToUpload.length);
      onUploadStateChange?.(true);

      const newImages: GalleryImage[] = [];

      try {
        for (const file of filesToUpload) {
          // Validate file type
          const validTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif',
          ];
          if (!validTypes.includes(file.type)) {
            showErrorToast({
              title: t('upload.invalidFileType'),
              description: t('upload.invalidFileTypeMessage'),
              error: new Error(t('upload.invalidFileTypeMessage')),
              isDeveloper,
            });
            setUploadingCount(prev => Math.max(0, prev - 1));
            continue;
          }

          try {
            const result = await imageUploadService.uploadImage({
              file,
              bucket,
              path: pathPrefix,
              isPrimary: false,
            });

            newImages.push({
              url: result.publicUrl,
              isCover: false,
            });
          } catch (error) {
            const err =
              error instanceof Error
                ? error
                : new Error(t('upload.uploadFailed'));
            showErrorToast({
              title: t('upload.uploadFailed'),
              description: t('upload.imageFailed'),
              error: err,
              isDeveloper,
            });
          }
          setUploadingCount(prev => Math.max(0, prev - 1));
        }

        if (newImages.length > 0) {
          // If no existing images, set first new image as cover
          const isFirstUpload = value.length === 0;
          if (isFirstUpload && newImages.length > 0) {
            newImages[0].isCover = true;
          }

          onChange([...value, ...newImages]);
          toast.success(
            tToast('gallery.imagesUploaded', { count: newImages.length })
          );
        }
      } finally {
        setIsUploading(false);
        setUploadingCount(0);
        onUploadStateChange?.(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [
      value,
      onChange,
      maxImages,
      bucket,
      pathPrefix,
      t,
      tToast,
      isDeveloper,
      onUploadStateChange,
    ]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (index: number) => {
    const newImages = [...value];
    const wasRemovingCover = newImages[index].isCover;
    newImages.splice(index, 1);

    // If we removed the cover and there are still images, set first as cover
    if (wasRemovingCover && newImages.length > 0) {
      newImages[0].isCover = true;
    }

    onChange(newImages);
  };

  const handleSetCover = (index: number) => {
    const newImages = value.map((img, i) => ({
      ...img,
      isCover: i === index,
    }));
    onChange(newImages);
  };

  const canAddMore = value.length < maxImages;

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <label className='text-xs uppercase text-muted-foreground'>
          {label}
        </label>
      )}

      <input
        ref={fileInputRef}
        type='file'
        accept='image/jpeg,image/jpg,image/png,image/webp,image/gif'
        onChange={handleChange}
        multiple
        className='hidden'
      />

      {/* Image Grid */}
      {(value.length > 0 || uploadingCount > 0) && (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
          {/* Existing images */}
          {value.map((image, index) => (
            <div
              key={image.url}
              className={cn(
                'group relative aspect-square overflow-hidden bg-black/20 border',
                image.isCover ? 'border-fm-gold border-2' : 'border-white/10'
              )}
            >
              <img
                src={image.url}
                alt={`${t('gallery.image')} ${index + 1}`}
                className='w-full h-full object-cover'
              />

              {/* Cover badge */}
              {image.isCover && (
                <div className='absolute top-1 left-1 px-1.5 py-0.5 bg-fm-gold text-black text-[10px] flex items-center gap-1'>
                  <Star className='h-3 w-3 fill-current' />
                  {t('gallery.cover')}
                </div>
              )}

              {/* Hover overlay with actions */}
              <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                {!image.isCover && (
                  <FmCommonIconButton
                    icon={Star}
                    size='sm'
                    variant='gold'
                    tooltip={t('gallery.setAsCover')}
                    onClick={() => handleSetCover(index)}
                  />
                )}
                <FmCommonIconButton
                  icon={X}
                  size='sm'
                  variant='destructive'
                  tooltip={t('buttons.remove')}
                  onClick={() => handleRemove(index)}
                />
              </div>
            </div>
          ))}

          {/* Uploading placeholders */}
          {uploadingCount > 0 &&
            Array.from({ length: uploadingCount }).map((_, index) => (
              <div
                key={`uploading-${index}`}
                className='relative aspect-square bg-black/40 border border-fm-gold/30 overflow-hidden flex items-center justify-center'
              >
                <div className='flex flex-col items-center gap-2'>
                  <FmCommonLoadingSpinner size='md' />
                  <span className='text-xs text-muted-foreground'>
                    {t('upload.uploading')}
                  </span>
                </div>
              </div>
            ))}

          {/* Add more button (when there are existing images) */}
          {canAddMore && !isUploading && (
            <button
              type='button'
              onClick={handleButtonClick}
              className='aspect-square border-2 border-dashed border-white/20 hover:border-fm-gold/50 hover:bg-muted/20 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-fm-gold'
            >
              <Plus className='h-8 w-8' />
              <span className='text-xs'>{t('gallery.addMore')}</span>
            </button>
          )}
        </div>
      )}

      {/* Empty state / Dropzone */}
      {value.length === 0 && uploadingCount === 0 && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
          className={cn(
            'flex flex-col items-center justify-center border-2 border-dashed p-8 transition-colors cursor-pointer',
            dragActive
              ? 'border-fm-gold bg-fm-gold/10'
              : 'border-white/20 hover:border-fm-gold/50 hover:bg-muted/20'
          )}
        >
          <ImageIcon className='mb-3 h-10 w-10 text-muted-foreground' />
          <p className='mb-1 text-sm font-medium'>
            {t('upload.dropImagesOr')}{' '}
            <span className='text-fm-gold hover:underline'>
              {t('upload.browse')}
            </span>
          </p>
          <p className='text-xs text-muted-foreground'>
            {t('gallery.uploadMultipleDescription')}
          </p>
          <p className='text-xs text-muted-foreground mt-1'>
            {t('gallery.firstImageIsCover')}
          </p>
        </div>
      )}

      {/* Helper text */}
      <p className='text-xs text-muted-foreground'>
        {t('gallery.imageCount', { count: value.length, max: maxImages })}
      </p>
    </div>
  );
};
