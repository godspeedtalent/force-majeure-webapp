import { supabase } from '@/api/supabase/client';
import { logger } from '@/services/logger';
import { compressImage, ImageCompressionOptions } from '@/utils/imageUtils';

export interface UploadImageOptions {
  file: File;
  bucket?: string;
  path?: string;
  eventId?: string;
  isPrimary?: boolean;
  /** Compression options (enabled by default) */
  compressionOptions?: ImageCompressionOptions | false;
}

export interface UploadImageResult {
  publicUrl: string;
  storagePath: string;
  imageId?: string;
}

export interface EventImage {
  id: string;
  event_id: string | null;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  is_primary: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Image Upload Service
 *
 * Handles uploading images to Supabase Storage and managing metadata.
 * Supports event images with automatic resizing and optimization.
 */
export const imageUploadService = {
  /**
   * Upload an image to Supabase Storage
   */
  async uploadImage({
    file,
    bucket = 'event-images',
    path,
    eventId,
    isPrimary = false,
    compressionOptions,
  }: UploadImageOptions): Promise<UploadImageResult> {
    // Validate file type
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!validTypes.includes(file.type)) {
      throw new Error(
        'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'
      );
    }

    // Compress image if needed (enabled by default unless explicitly disabled)
    let processedFile = file;
    if (compressionOptions !== false) {
      try {
        processedFile = await compressImage(file, compressionOptions || {});
      } catch (error) {
        logger.error('Image compression failed, using original file', {
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'imageUploadService.uploadImage',
        });
        // Continue with original file if compression fails
        processedFile = file;
      }
    }

    // Validate file size after compression (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (processedFile.size > maxSize) {
      throw new Error(
        `File size exceeds 5MB limit even after compression. Current size: ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExt = processedFile.name.split('.').pop();
    const fileName = `${timestamp}-${randomSuffix}.${fileExt}`;

    // Construct storage path
    // If path is provided as a prefix (e.g., "venues" or "events/123"), append the filename
    // If path is a complete path with extension, use it as-is
    let storagePath: string;
    if (path) {
      // Check if path already has a file extension
      if (/\.\w+$/.test(path)) {
        // Path has extension, use as-is (e.g., "venues/123456.jpg")
        storagePath = path;
      } else {
        // Path is a prefix, append filename (e.g., "venues" -> "venues/123456.jpg")
        storagePath = `${path}/${fileName}`;
      }
    } else {
      // No path provided, use default based on eventId
      storagePath = eventId ? `events/${eventId}/${fileName}` : `misc/${fileName}`;
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, processedFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image.');
    }

    // Get image dimensions (optional)
    const dimensions = await getImageDimensions(processedFile);

    // Save metadata to database if eventId is provided
    let imageId: string | undefined;
    if (eventId) {
      const { data: imageData, error: dbError } = await supabase
        .from('event_images')
        .insert({
          event_id: eventId,
          storage_path: storagePath,
          file_name: processedFile.name,
          file_size: processedFile.size,
          mime_type: processedFile.type,
          width: dimensions?.width,
          height: dimensions?.height,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (dbError) {
        logger.error('Failed to save image metadata:', dbError);
        // Don't throw - image was uploaded successfully
      } else {
        imageId = imageData.id;
      }
    }

    return {
      publicUrl: urlData.publicUrl,
      storagePath,
      imageId,
    };
  },

  /**
   * Delete an image from storage and database
   */
  async deleteImage(imageId: string, bucket = 'event-images'): Promise<void> {
    // Get image metadata
    const { data: imageData, error: fetchError } = await supabase
      .from('event_images')
      .select('storage_path, event_id')
      .eq('id', imageId)
      .single();

    if (fetchError || !imageData) {
      throw new Error('Image not found.');
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([imageData.storage_path]);

    if (storageError) {
      throw new Error(`Failed to delete image: ${storageError.message}`);
    }

    // Delete metadata from database
    const { error: dbError } = await supabase
      .from('event_images')
      .delete()
      .eq('id', imageId);

    if (dbError) {
      logger.error('Failed to delete image metadata:', dbError);
    }
  },

  /**
   * Get all images for an event
   */
  async getEventImages(eventId: string): Promise<EventImage[]> {
    const { data, error } = await supabase
      .from('event_images')
      .select('*')
      .eq('event_id', eventId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch event images: ${error.message}`);
    }

    return data as EventImage[];
  },

  /**
   * Set an image as primary for an event
   */
  async setPrimaryImage(imageId: string, eventId: string): Promise<void> {
    // Unset all other primary images for this event
    await supabase
      .from('event_images')
      .update({ is_primary: false })
      .eq('event_id', eventId);

    // Set this image as primary
    const { error: updateError } = await supabase
      .from('event_images')
      .update({ is_primary: true })
      .eq('id', imageId);

    if (updateError) {
      throw new Error(`Failed to set primary image: ${updateError.message}`);
    }

    // Get the image data to update the event
    const { data: imageData, error: fetchError } = await supabase
      .from('event_images')
      .select('storage_path')
      .eq('id', imageId)
      .single();

    if (fetchError || !imageData) {
      throw new Error('Image not found.');
    }

    // Get public URL (ensure it's accessible without storing the value)
    supabase.storage.from('event-images').getPublicUrl(imageData.storage_path);
  },

  /**
   * Get public URL for a storage path
   */
  getPublicUrl(storagePath: string, bucket = 'event-images'): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);

    return data.publicUrl;
  },
};

/**
 * Helper function to get image dimensions
 */
function getImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}
