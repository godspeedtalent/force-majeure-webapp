import { supabase } from '@/shared/api/supabase/client';

export interface UploadImageOptions {
  file: File;
  bucket?: string;
  path?: string;
  eventId?: string;
  isPrimary?: boolean;
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

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 5MB limit.');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomSuffix}.${fileExt}`;

    // Construct storage path
    const storagePath =
      path || (eventId ? `events/${eventId}/${fileName}` : `misc/${fileName}`);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file, {
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
    const dimensions = await getImageDimensions(file);

    // Save metadata to database if eventId is provided
    let imageId: string | undefined;
    if (eventId) {
      const { data: imageData, error: dbError } = await supabase
        .from('event_images' as any)
        .insert({
          event_id: eventId,
          storage_path: storagePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          width: dimensions?.width,
          height: dimensions?.height,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Failed to save image metadata:', dbError);
        // Don't throw - image was uploaded successfully
      } else {
        imageId = (imageData as any).id;

        // If this is the primary image, update the event's hero_image
        if (isPrimary) {
          await supabase
            .from('events')
            .update({ hero_image: urlData.publicUrl } as any)
            .eq('id', eventId);
        }
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
      .from('event_images' as any)
      .select('storage_path, event_id')
      .eq('id', imageId)
      .single();

    if (fetchError || !imageData) {
      throw new Error('Image not found.');
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([(imageData as any).storage_path]);

    if (storageError) {
      throw new Error(`Failed to delete image: ${storageError.message}`);
    }

    // Delete metadata from database
    const { error: dbError } = await supabase
      .from('event_images' as any)
      .delete()
      .eq('id', imageId);

    if (dbError) {
      console.error('Failed to delete image metadata:', dbError);
    }
  },

  /**
   * Get all images for an event
   */
  async getEventImages(eventId: string): Promise<EventImage[]> {
    const { data, error } = await supabase
      .from('event_images' as any)
      .select('*')
      .eq('event_id', eventId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch event images: ${error.message}`);
    }

    return data as any as EventImage[];
  },

  /**
   * Set an image as primary for an event
   */
  async setPrimaryImage(imageId: string, eventId: string): Promise<void> {
    // Unset all other primary images for this event
    await supabase
      .from('event_images' as any)
      .update({ is_primary: false })
      .eq('event_id', eventId);

    // Set this image as primary
    const { error: updateError } = await supabase
      .from('event_images' as any)
      .update({ is_primary: true })
      .eq('id', imageId);

    if (updateError) {
      throw new Error(`Failed to set primary image: ${updateError.message}`);
    }

    // Get the image data to update the event
    const { data: imageData, error: fetchError } = await supabase
      .from('event_images' as any)
      .select('storage_path')
      .eq('id', imageId)
      .single();

    if (fetchError || !imageData) {
      throw new Error('Image not found.');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('event-images')
      .getPublicUrl((imageData as any).storage_path);

    // Update event's hero_image
    await supabase
      .from('events')
      .update({ hero_image: urlData.publicUrl } as any)
      .eq('id', eventId);
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
