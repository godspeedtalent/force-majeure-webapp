import { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2, Link as LinkIcon } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { imageUploadService } from '@/shared/services/imageUploadService';
import { useToast } from '@/shared/hooks/use-toast';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { showErrorToast } from '@/components/common/feedback/FmErrorToast';
import { cn } from '@/shared/utils/utils';

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
}: FmFlexibleImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: userRole } = useUserRole();

  // Check if user is developer or admin for detailed error messages
  const isDeveloper =
    userRole === ('developer' as any) || userRole === ('admin' as any);

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
      const error = new Error(
        'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.'
      );
      showErrorToast({
        title: 'Invalid File Type',
        description: error.message,
        error,
        isDeveloper,
      });
      return;
    }

    // Validate file size
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      const error = new Error('File size exceeds 5MB limit.');
      showErrorToast({
        title: 'File Too Large',
        description: error.message,
        error,
        isDeveloper,
      });
      return;
    }

    setUploading(true);

    try {
      const result = await imageUploadService.uploadImage({
        file,
        bucket,
        path: pathPrefix
          ? `${pathPrefix}/${Date.now()}-${file.name}`
          : undefined,
        eventId: entityId,
        isPrimary,
      });

      onChange(result.publicUrl);
      setUrlInput(result.publicUrl);
      toast({
        title: 'Upload Successful',
        description: 'Image uploaded successfully.',
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      showErrorToast({
        title: 'Upload Failed',
        description: 'Image failed to upload.',
        error: err,
        isDeveloper,
      });
    } finally {
      setUploading(false);
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
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      toast({
        title: 'URL Set',
        description: 'Image URL has been set.',
      });
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Mode Toggle */}
      <div className='flex items-center gap-2 text-sm'>
        <span className='text-muted-foreground'>Image source:</span>
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
          Upload File
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
          External URL
        </button>
      </div>

      {mode === 'url' ? (
        /* URL Input Mode */
        <div className='space-y-4'>
          <FmCommonTextField
            label={`${label} URL`}
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder='https://example.com/image.jpg'
            description='Enter a direct URL to an external image'
          />
          <FmCommonButton
            variant='secondary'
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
            className='w-full'
          >
            <LinkIcon className='mr-2 h-4 w-4' />
            Set Image URL
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

          {value ? (
            /* Preview uploaded image */
            <div className='space-y-4'>
              <div className='relative aspect-video w-full overflow-hidden rounded-none bg-muted'>
                <img
                  src={value}
                  alt='Preview'
                  className='h-full w-full object-cover'
                />
                <button
                  type='button'
                  onClick={handleRemove}
                  className='absolute top-2 right-2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80'
                  disabled={uploading}
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
              <FmCommonButton
                variant='secondary'
                onClick={handleButtonClick}
                disabled={uploading}
                className='w-full'
              >
                <Upload className='mr-2 h-4 w-4' />
                Replace Image
              </FmCommonButton>
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
                  : 'border-border bg-card hover:border-fm-gold/50 hover:bg-muted/50',
                uploading && 'pointer-events-none opacity-50'
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className='mb-4 h-12 w-12 animate-spin text-fm-gold' />
                  <p className='text-sm text-muted-foreground'>Uploading...</p>
                </>
              ) : (
                <>
                  <ImageIcon className='mb-4 h-12 w-12 text-muted-foreground' />
                  <p className='mb-2 text-sm font-medium'>
                    Drop your image here, or{' '}
                    <button
                      type='button'
                      onClick={handleButtonClick}
                      className='text-fm-gold hover:underline'
                    >
                      browse
                    </button>
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    JPEG, PNG, WebP, or GIF (max 5MB)
                  </p>
                </>
              )}
            </div>
          )}
        </FmCommonCard>
      )}

      {/* Current image preview if URL is set */}
      {value && mode === 'url' && (
        <div className='relative aspect-video w-full overflow-hidden rounded-none bg-muted border border-white/20'>
          <img
            src={value}
            alt='Preview'
            className='h-full w-full object-cover'
            onError={(e) => {
              e.currentTarget.src = '';
              e.currentTarget.alt = 'Failed to load image';
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
