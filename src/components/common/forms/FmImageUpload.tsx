import { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { imageUploadService } from '@/shared/services/imageUploadService';
import { useToast } from '@/shared/hooks/use-toast';
import { useUserRole } from '@/shared/hooks/useUserRole';
import { showErrorToast } from '@/components/common/feedback/FmErrorToast';
import { cn } from '@/shared/utils/utils';

interface FmImageUploadProps {
  eventId?: string;
  currentImageUrl?: string;
  onUploadComplete?: (publicUrl: string) => void;
  onUploadError?: (error: Error) => void;
  isPrimary?: boolean;
  className?: string;
}

/**
 * FmImageUpload Component
 * 
 * A drag-and-drop image upload component for event images.
 * Uploads to Supabase Storage and manages metadata.
 * 
 * Features:
 * - Drag and drop support
 * - File type validation (JPEG, PNG, WebP, GIF)
 * - 5MB size limit
 * - Image preview
 * - Progress indicator
 * - Delete existing image
 */
export const FmImageUpload = ({
  eventId,
  currentImageUrl,
  onUploadComplete,
  onUploadError,
  isPrimary = true,
  className,
}: FmImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: userRole } = useUserRole();
  
  // Check if user is developer or admin for detailed error messages
  const isDeveloper = userRole === ('developer' as any) || userRole === ('admin' as any);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      const error = new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
      showErrorToast({
        title: 'Invalid File Type',
        description: error.message,
        error,
        isDeveloper,
      });
      onUploadError?.(error);
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
      onUploadError?.(error);
      return;
    }

    setUploading(true);

    try {
      const result = await imageUploadService.uploadImage({
        file,
        eventId,
        isPrimary,
      });

      setImageUrl(result.publicUrl);
      toast({
        title: 'Upload Successful',
        description: 'Image uploaded successfully.',
      });
      onUploadComplete?.(result.publicUrl);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      showErrorToast({
        title: 'Upload Failed',
        description: 'Image failed to upload.',
        error: err,
        isDeveloper,
      });
      onUploadError?.(err);
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
    setImageUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <FmCommonCard variant="outline" className={cn('p-6', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />

      {imageUrl ? (
        /* Preview uploaded image */
        <div className="space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <img
              src={imageUrl}
              alt="Event"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <FmCommonButton
            variant="secondary"
            onClick={handleButtonClick}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
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
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors',
            dragActive
              ? 'border-fm-gold bg-fm-gold/10'
              : 'border-border bg-card hover:border-fm-gold/50 hover:bg-muted/50',
            uploading && 'pointer-events-none opacity-50'
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-fm-gold" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-sm font-medium">
                Drop your image here, or{' '}
                <button
                  type="button"
                  onClick={handleButtonClick}
                  className="text-fm-gold hover:underline"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, or GIF (max 5MB)
              </p>
            </>
          )}
        </div>
      )}
    </FmCommonCard>
  );
};
