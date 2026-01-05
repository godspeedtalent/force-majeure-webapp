import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, ImageIcon } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { imageUploadService } from '@/shared';
import { toast } from 'sonner';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { showErrorToast } from '@/components/common/feedback/FmErrorToast';
import { cn } from '@/shared';

type UploadState = 'idle' | 'compressing' | 'uploading';

interface FmFlexibleImageUploadProps {
  /** Current image URL */
  value?: string;
  /** Callback when image URL changes */
  onChange: (url: string) => void;
  /** Label for the upload section */
  label?: string;
  /** Bucket to upload to (default: 'event-images') */
  bucket?: string;
  /** Optional path prefix for uploads */
  pathPrefix?: string;
  /** Optional entity ID for organizing uploads */
  entityId?: string;
  /** Whether this is the primary image for the entity */
  isPrimary?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback when upload state changes (for form submission control) */
  onUploadStateChange?: (isUploading: boolean) => void;
}

/**
 * FmFlexibleImageUpload Component
 *
 * An image upload component for uploading files to Supabase Storage.
 *
 * Features:
 * - Drag and drop support
 * - File type validation (JPEG, PNG, WebP, GIF)
 * - Automatic compression for large images
 * - Image preview with upload progress
 */
export const FmFlexibleImageUpload = ({
  value,
  onChange,
  bucket = 'event-images',
  pathPrefix,
  entityId,
  isPrimary = false,
  className,
  onUploadStateChange,
}: FmFlexibleImageUploadProps) => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: userRole } = useUserRole();

  // Check if user is developer or admin for detailed error messages
  const isDeveloper =
    userRole === ('developer' as any) || userRole === ('admin' as any);

  const isUploading = uploadState !== 'idle';

  // Notify parent of upload state changes
  useEffect(() => {
    onUploadStateChange?.(isUploading);
  }, [isUploading, onUploadStateChange]);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!validTypes.includes(file.type)) {
      const error = new Error(t('upload.invalidFileTypeMessage'));
      showErrorToast({
        title: t('upload.invalidFileType'),
        description: error.message,
        error,
        isDeveloper,
      });
      return;
    }

    // Create immediate preview
    const filePreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(filePreviewUrl);

    // Show compression state if file is large
    if (file.size > 5 * 1024 * 1024) {
      setUploadState('compressing');
    } else {
      setUploadState('uploading');
    }

    try {
      // Upload will handle compression internally
      const result = await imageUploadService.uploadImage({
        file,
        bucket,
        path: pathPrefix,
        eventId: entityId,
        isPrimary,
      });

      // Clean up preview URL
      URL.revokeObjectURL(filePreviewUrl);
      setPreviewUrl(null);

      onChange(result.publicUrl);
      toast.success(tToast('upload.success'), {
        description: file.size > 5 * 1024 * 1024
          ? t('upload.compressedAndUploaded')
          : t('upload.uploadedSuccessfully'),
      });
    } catch (error) {
      // Clean up preview URL on error
      URL.revokeObjectURL(filePreviewUrl);
      setPreviewUrl(null);

      const err = error instanceof Error ? error : new Error(t('upload.uploadFailed'));
      showErrorToast({
        title: t('upload.uploadFailed'),
        description: t('upload.imageFailed'),
        error: err,
        isDeveloper,
      });
    } finally {
      setUploadState('idle');
    }
  };

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    // Clean up preview URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <FmCommonCard variant='default' className='p-6'>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/jpeg,image/jpg,image/png,image/webp,image/gif'
          onChange={handleChange}
          className='hidden'
        />

        {value || previewUrl ? (
          /* Preview uploaded or uploading image */
          <div className='space-y-4'>
            <div className='relative aspect-video w-full overflow-hidden rounded-none bg-muted'>
              <img
                src={previewUrl || value}
                alt={t('upload.imagePreview')}
                className={cn(
                  'h-full w-full object-cover transition-opacity',
                  isUploading && 'opacity-60'
                )}
              />
              {/* Upload progress overlay */}
              {isUploading && (
                <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm'>
                  <div className='mb-3 h-12 w-12 animate-spin rounded-full border-4 border-fm-gold border-b-transparent' />
                  <p className='text-sm font-medium text-white'>
                    {uploadState === 'compressing'
                      ? t('upload.compressing')
                      : t('upload.uploading')}
                  </p>
                </div>
              )}
              {/* Remove button (disabled during upload) */}
              {!isUploading && (
                <button
                  type='button'
                  onClick={handleRemove}
                  className='absolute top-2 right-2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80'
                >
                  <X className='h-4 w-4' />
                </button>
              )}
            </div>
            {!isUploading && (
              <FmCommonButton
                variant='secondary'
                onClick={handleButtonClick}
                className='w-full'
              >
                <Upload className='mr-2 h-4 w-4' />
                {t('upload.replaceImage')}
              </FmCommonButton>
            )}
          </div>
        ) : (
          /* Upload dropzone */
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleButtonClick}
            className={cn(
              'flex flex-col items-center justify-center rounded-none border-2 border-dashed p-12 transition-colors cursor-pointer',
              dragActive
                ? 'border-fm-gold bg-fm-gold/10'
                : 'border-border bg-card hover:border-fm-gold/50 hover:bg-muted/50'
            )}
          >
            <ImageIcon className='mb-4 h-12 w-12 text-muted-foreground' />
            <p className='mb-2 text-sm font-medium'>
              {t('upload.dropImageOr')}{' '}
              <span className='text-fm-gold hover:underline'>
                {t('upload.browse')}
              </span>
            </p>
            <p className='text-xs text-muted-foreground'>
              {t('upload.supportedFormats')}
            </p>
          </div>
        )}
      </FmCommonCard>
    </div>
  );
};
