import * as React from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { toast } from 'sonner';
import { supabase } from '@/shared/api/supabase/client';
import { cn } from '@/shared/utils/utils';

interface FmDataGridImageUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentImageUrl?: string | null;
  entityName?: string;
  onImageUploaded: (newImageUrl: string) => void;
  bucket?: string;
  storagePath?: string;
}

/**
 * FmDataGridImageUploadModal
 *
 * Modal for uploading images in data grid cells.
 * - Max resolution: 500x500px
 * - Saves to Supabase Storage
 * - Returns public URL for database update
 * - No URL input - file upload only
 */
export function FmDataGridImageUploadModal({
  open,
  onOpenChange,
  currentImageUrl,
  entityName = 'Entity',
  onImageUploaded,
  bucket = 'entity-images',
  storagePath,
}: FmDataGridImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setPreview(null);
      setIsDragging(false);
    }
  }, [open]);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type', {
        description: 'Please upload a JPEG, PNG, or WebP image.',
      });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File too large', {
        description: 'Please upload an image smaller than 5MB.',
      });
      return;
    }

    // Resize image to max 500x500
    const resizedFile = await resizeImage(file, 500, 500);
    
    setSelectedFile(resizedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(resizedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('No file selected', {
        description: 'Please select an image to upload.',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${timestamp}-${randomSuffix}.${fileExt}`;

      // Construct storage path
      const fullPath = storagePath
        ? `${storagePath}/${fileName}`
        : `misc/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fullPath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fullPath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL.');
      }

      toast.success('Image uploaded', {
        description: 'Image uploaded successfully.',
      });

      // Call the callback with new URL
      onImageUploaded(urlData.publicUrl);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload failed', {
        description: error.message || 'Failed to upload image.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent 
        className='sm:max-w-[500px] bg-black/90 backdrop-blur-md border border-white/20'
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside if uploading
          if (isUploading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with Escape if uploading
          if (isUploading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className='text-fm-gold'>
            Upload Image for {entityName}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-[20px] py-[20px]'>
          {/* Current Image Preview */}
          {currentImageUrl && !preview && (
            <div className='space-y-[10px]'>
              <p className='text-sm text-white/70'>Current Image:</p>
              <img
                src={currentImageUrl}
                alt='Current'
                className='w-full h-[200px] object-cover border border-white/20'
              />
            </div>
          )}

          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-none p-[40px]',
              'flex flex-col items-center justify-center gap-[20px]',
              'cursor-pointer transition-all',
              isDragging
                ? 'border-fm-gold bg-fm-gold/10'
                : 'border-white/20 hover:border-fm-gold/50 hover:bg-white/5'
            )}
          >
            {preview ? (
              <div className='relative w-full'>
                <img
                  src={preview}
                  alt='Preview'
                  className='w-full h-[200px] object-cover border border-white/20'
                />
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className='absolute top-2 right-2 p-1 bg-black/80 text-white hover:text-fm-danger transition-colors'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            ) : (
              <>
                <div className='h-16 w-16 rounded-full bg-white/10 flex items-center justify-center'>
                  <ImageIcon className='h-8 w-8 text-white/50' />
                </div>
                <div className='text-center'>
                  <p className='text-white font-medium mb-[5px]'>
                    Drop image here or click to browse
                  </p>
                  <p className='text-white/50 text-sm'>
                    JPEG, PNG, or WebP • Max 5MB • Will be resized to 500x500px
                  </p>
                </div>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type='file'
            accept='image/jpeg,image/jpg,image/png,image/webp'
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className='hidden'
          />
        </div>

        <DialogFooter className='gap-[10px]'>
          <FmCommonButton
            variant='secondary'
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </FmCommonButton>
          <FmCommonButton
            variant='gold'
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
                Uploading...
              </>
            ) : (
              <>
                <Upload className='h-4 w-4 mr-2' />
                Upload Image
              </>
            )}
          </FmCommonButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Resize image to fit within max dimensions while maintaining aspect ratio
 */
async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;

          if (width > height) {
            width = maxWidth;
            height = Math.round(width / aspectRatio);
          } else {
            height = maxHeight;
            width = Math.round(height * aspectRatio);
          }
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            // Create new file
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            resolve(resizedFile);
          },
          file.type,
          0.9
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
