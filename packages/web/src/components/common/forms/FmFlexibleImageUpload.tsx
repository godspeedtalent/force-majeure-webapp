import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, ImageIcon, Link as LinkIcon } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { imageUploadService } from '@force-majeure/shared';
import { toast } from 'sonner';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { showErrorToast } from '@/components/common/feedback/FmErrorToast';
import { cn } from '@force-majeure/shared';

type UploadState = 'idle' | 'compressing' | 'uploading';

interface FmFlexibleImageUploadProps {
  /** Current image URL (can be external or internal) */
  value?: string;
  /** Callback when image URL changes (from upload or manual URL input) */
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
 * A flexible image upload component that supports both:
 * 1. Direct file upload to Supabase Storage
 * 2. Manual URL input for external images
 *
 * Features:
 * - Drag and drop support
 * - File type validation (JPEG, PNG, WebP, GIF)
 * - 5MB size limit
 * - Image preview
 * - Manual URL input option
 * - Toggle between upload and URL input modes
 */
export const FmFlexibleImageUpload = ({
  value,
  onChange,
  label = 'Image',
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
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value || '');
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
      setUrlInput(result.publicUrl);
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
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      toast.success(t('upload.urlSet'), {
        description: t('upload.urlSetDescription'),
      });
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Mode Toggle */}
      <div className='flex items-center gap-2 text-sm'>
        <span className='text-muted-foreground'>{t('upload.imageSource')}:</span>
        <button
          type='button'
          onClick={() => setMode('upload')}
          className={cn(
            'px-3 py-1 rounded-none transition-colors',
            mode === 'upload'
              ? 'bg-fm-gold text-black'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          )}
        >
          {t('upload.uploadFile')}
        </button>
        <button
          type='button'
          onClick={() => setMode('url')}
          className={cn(
            'px-3 py-1 rounded-none transition-colors',
            mode === 'url'
              ? 'bg-fm-gold text-black'
              : 'bg-white/5 text-white/70 hover:bg-white/10'
          )}
        >
          {t('upload.externalUrl')}
        </button>
      </div>

      {mode === 'url' ? (
        /* URL Input Mode */
        <div className='space-y-4'>
          <FmCommonTextField
            label={`${label} URL`}
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder={t('placeholders.exampleImageUrl')}
            description={t('upload.enterDirectUrl')}
          />
          <FmCommonButton
            variant='secondary'
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
            className='w-full'
          >
            <LinkIcon className='mr-2 h-4 w-4' />
            {t('upload.setImageUrl')}
          </FmCommonButton>
        </div>
      ) : (
        /* File Upload Mode */
        <FmCommonCard variant='outline' className='p-6'>
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
              className={cn(
                'flex flex-col items-center justify-center rounded-none border-2 border-dashed p-12 transition-colors',
                dragActive
                  ? 'border-fm-gold bg-fm-gold/10'
                  : 'border-border bg-card hover:border-fm-gold/50 hover:bg-muted/50'
              )}
            >
              <ImageIcon className='mb-4 h-12 w-12 text-muted-foreground' />
              <p className='mb-2 text-sm font-medium'>
                {t('upload.dropImageOr')}{' '}
                <button
                  type='button'
                  onClick={handleButtonClick}
                  className='text-fm-gold hover:underline'
                >
                  {t('upload.browse')}
                </button>
              </p>
              <p className='text-xs text-muted-foreground'>
                {t('upload.supportedFormats')}
              </p>
            </div>
          )}
        </FmCommonCard>
      )}

      {/* Current image preview if URL is set */}
      {value && mode === 'url' && (
        <div className='relative aspect-video w-full overflow-hidden rounded-none bg-muted border border-white/20'>
          <img
            src={value}
            alt={t('upload.imagePreview')}
            className='h-full w-full object-cover'
            onError={(e) => {
              e.currentTarget.src = '';
              e.currentTarget.alt = t('upload.failedToLoad');
              e.currentTarget.className = 'h-full w-full flex items-center justify-center text-muted-foreground';
            }}
          />
          <button
            type='button'
            onClick={handleRemove}
            className='absolute top-2 right-2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      )}
    </div>
  );
};
