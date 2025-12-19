import { supabase } from '@/shared';
import { logger } from '@/shared';

export const getImageUrl = (imagePath: string | null): string => {
  if (!imagePath) {
    return '/placeholder.svg';
  }

  // If it's already a full URL, return as is
  if (
    imagePath.startsWith('http') ||
    imagePath.startsWith('/lovable-uploads/')
  ) {
    return imagePath;
  }

  // If it's a storage path, get the public URL
  if (imagePath.startsWith('images/')) {
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(imagePath.replace('images/', ''));
    return data.publicUrl;
  }

  // For other paths, assume they're in the images bucket
  const { data } = supabase.storage.from('images').getPublicUrl(imagePath);
  return data.publicUrl;
};

export interface ImageCompressionOptions {
  /** Maximum width in pixels (default: 1920) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 1920) */
  maxHeight?: number;
  /** Maximum file size in bytes (default: 5MB) */
  maxSizeBytes?: number;
  /** JPEG/WebP quality 0-1 (default: 0.85) */
  quality?: number;
  /** Output format (default: original format or 'jpeg') */
  outputFormat?: 'jpeg' | 'png' | 'webp';
  /** Force resize even if file is under size limit (default: false) */
  forceResize?: boolean;
}

/**
 * Compresses an image file if it exceeds size or dimension limits
 *
 * @param file - The original image file
 * @param options - Compression options
 * @returns Compressed file or original if already within limits
 */
export const compressImage = async (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    maxSizeBytes = 5 * 1024 * 1024, // 5MB
    quality = 0.85,
    outputFormat,
    forceResize = false,
  } = options;

  // If file is already small enough and we're not forcing resize, return as is
  if (file.size <= maxSizeBytes && !forceResize) {
    logger.info('Image within size limit, skipping compression', {
      fileSize: file.size,
      maxSize: maxSizeBytes,
      source: 'imageUtils.compressImage',
    });
    return file;
  }

  logger.info('Compressing image', {
    originalSize: file.size,
    maxSize: maxSizeBytes,
    source: 'imageUtils.compressImage',
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        // Scale down if either dimension exceeds the max
        if (width > maxWidth || height > maxHeight) {
          // Calculate scale factors for both dimensions
          const widthScale = maxWidth / width;
          const heightScale = maxHeight / height;

          // Use the smaller scale to ensure both dimensions fit within limits
          const scale = Math.min(widthScale, heightScale);

          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Determine output format
        const mimeType = outputFormat
          ? `image/${outputFormat}`
          : file.type === 'image/png'
            ? 'image/png'
            : 'image/jpeg';

        // Convert canvas to blob
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new file from blob
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg'),
              { type: mimeType }
            );

            logger.info('Image compressed successfully', {
              originalSize: file.size,
              compressedSize: compressedFile.size,
              reduction: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`,
              dimensions: `${width}x${height}`,
              source: 'imageUtils.compressImage',
            });

            resolve(compressedFile);
          },
          mimeType,
          quality
        );

        // Cleanup
        URL.revokeObjectURL(img.src);
      } catch (error) {
        logger.error('Error compressing image', {
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'imageUtils.compressImage',
        });
        reject(error);
      }
    };

    img.onerror = () => {
      const error = new Error('Failed to load image for compression');
      logger.error('Failed to load image', {
        error: error.message,
        source: 'imageUtils.compressImage',
      });
      reject(error);
    };

    // Load image from file
    img.src = URL.createObjectURL(file);
  });
};
