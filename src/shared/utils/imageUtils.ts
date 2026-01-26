import { supabase } from '@/shared';
import { logger } from '@/shared';
import heic2any from 'heic2any';

/**
 * Timeout wrapper for promises
 * Rejects with error message if promise doesn't resolve within the specified time
 */
const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  errorMsg: string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms)
    ),
  ]);
};

/**
 * Check if file is in HEIC/HEIF format (common on iOS devices)
 */
export const isHeicFormat = (file: File): boolean => {
  const heicTypes = ['image/heic', 'image/heif'];
  const heicExtensions = ['.heic', '.heif'];
  return (
    heicTypes.includes(file.type.toLowerCase()) ||
    heicExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  );
};

/**
 * Convert HEIC/HEIF image to JPEG
 * iOS devices take photos in HEIC format by default, which browsers can't display in canvas
 */
export const convertHeicToJpeg = async (file: File): Promise<File> => {
  logger.info('Converting HEIC to JPEG', {
    fileName: file.name,
    fileSize: file.size,
    source: 'imageUtils.convertHeicToJpeg',
  });

  try {
    const convertedBlob = await withTimeout(
      heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      }) as Promise<Blob>,
      30000, // 30 second timeout for HEIC conversion
      'HEIC conversion timed out. Please try a smaller image or convert to JPEG first.'
    );

    // heic2any can return a single blob or an array
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

    const convertedFile = new File(
      [blob],
      file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
      { type: 'image/jpeg' }
    );

    logger.info('HEIC conversion successful', {
      originalSize: file.size,
      convertedSize: convertedFile.size,
      source: 'imageUtils.convertHeicToJpeg',
    });

    return convertedFile;
  } catch (error) {
    logger.error('HEIC conversion failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      fileName: file.name,
      source: 'imageUtils.convertHeicToJpeg',
    });
    throw new Error(
      'Failed to convert HEIC image. Please try uploading a JPEG or PNG file instead.'
    );
  }
};

/**
 * Determines the correct storage bucket based on the image path prefix.
 *
 * Bucket mapping:
 * - events/, misc/ → event-images (main upload bucket via imageUploadService)
 * - artists/ → artist-images
 * - profiles/ → profile-images
 * - venues/, galleries/, or other → images (gallery system)
 */
const getBucketFromPath = (path: string): string => {
  if (path.startsWith('events/') || path.startsWith('misc/')) {
    return 'event-images';
  }
  if (path.startsWith('artists/')) {
    return 'artist-images';
  }
  if (path.startsWith('profiles/')) {
    return 'profile-images';
  }
  // Default to 'images' bucket for gallery system (venues/) and other paths
  return 'images';
};

export const getImageUrl = (imagePath: string | null, bucket?: string): string => {
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

  // Determine the bucket to use
  let targetBucket = bucket;
  let storagePath = imagePath;

  // If path has a bucket prefix like "images/", extract it
  if (imagePath.startsWith('images/')) {
    targetBucket = targetBucket || 'images';
    storagePath = imagePath.replace('images/', '');
  } else if (!targetBucket) {
    // Auto-detect bucket from path prefix
    targetBucket = getBucketFromPath(imagePath);
  }

  const { data } = supabase.storage.from(targetBucket).getPublicUrl(storagePath);
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
 * Includes timeout handling for mobile devices where canvas operations can hang
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

  // Convert HEIC to JPEG first if needed (iOS devices)
  let processedFile = file;
  if (isHeicFormat(file)) {
    processedFile = await convertHeicToJpeg(file);
  }

  // If file is already small enough and we're not forcing resize, return as is
  if (processedFile.size <= maxSizeBytes && !forceResize) {
    logger.info('Image within size limit, skipping compression', {
      fileSize: processedFile.size,
      maxSize: maxSizeBytes,
      source: 'imageUtils.compressImage',
    });
    return processedFile;
  }

  logger.info('Compressing image', {
    originalSize: processedFile.size,
    maxSize: maxSizeBytes,
    source: 'imageUtils.compressImage',
  });

  // Wrap the compression in a timeout to prevent infinite hangs on mobile
  const compressionPromise = new Promise<File>((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let imageLoadTimeout: ReturnType<typeof setTimeout>;
    let toBlobTimeout: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(imageLoadTimeout);
      clearTimeout(toBlobTimeout);
      URL.revokeObjectURL(img.src);
    };

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // Set timeout for image loading (10 seconds)
    imageLoadTimeout = setTimeout(() => {
      cleanup();
      reject(new Error('Image loading timed out. Please try a smaller image.'));
    }, 10000);

    img.onload = () => {
      clearTimeout(imageLoadTimeout);

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
          : processedFile.type === 'image/png'
            ? 'image/png'
            : 'image/jpeg';

        // Set timeout for toBlob operation (15 seconds)
        toBlobTimeout = setTimeout(() => {
          cleanup();
          reject(new Error('Image compression timed out. Please try a smaller image.'));
        }, 15000);

        // Convert canvas to blob
        canvas.toBlob(
          blob => {
            clearTimeout(toBlobTimeout);

            if (!blob) {
              cleanup();
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new file from blob
            const compressedFile = new File(
              [blob],
              processedFile.name.replace(/\.[^.]+$/, mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg'),
              { type: mimeType }
            );

            logger.info('Image compressed successfully', {
              originalSize: processedFile.size,
              compressedSize: compressedFile.size,
              reduction: `${((1 - compressedFile.size / processedFile.size) * 100).toFixed(1)}%`,
              dimensions: `${width}x${height}`,
              source: 'imageUtils.compressImage',
            });

            cleanup();
            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      } catch (error) {
        cleanup();
        logger.error('Error compressing image', {
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'imageUtils.compressImage',
        });
        reject(error);
      }
    };

    img.onerror = () => {
      cleanup();
      const error = new Error('Failed to load image. The format may not be supported.');
      logger.error('Failed to load image', {
        error: error.message,
        fileType: processedFile.type,
        source: 'imageUtils.compressImage',
      });
      reject(error);
    };

    // Load image from file
    img.src = URL.createObjectURL(processedFile);
  });

  return compressionPromise;
};
