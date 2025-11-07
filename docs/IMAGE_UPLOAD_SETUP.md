# Event Image Upload Setup

This document explains how to use the event image upload system powered by Supabase Storage.

## Overview

The image upload system provides:

- **Supabase Storage bucket** (`event-images`) for storing images
- **Database table** (`event_images`) for tracking image metadata
- **Service layer** (`imageUploadService`) for upload/delete operations
- **React component** (`FmImageUpload`) for drag-and-drop uploads
- **RLS policies** for secure access control

## Setup

### 1. Run the Migration

```bash
supabase migration up
```

This creates:

- `event-images` storage bucket (public, 5MB limit)
- `event_images` table for metadata
- RLS policies for admins, developers, and org admins

### 2. Verify Storage Bucket

Check that the bucket was created:

1. Go to Supabase Dashboard → Storage
2. Verify `event-images` bucket exists
3. Confirm it's set to public access

## Usage

### Basic Upload Component

```tsx
import { FmImageUpload } from '@/components/common/forms/FmImageUpload';

function EventForm() {
  const [eventId] = useState('some-event-id');

  return (
    <FmImageUpload
      eventId={eventId}
      isPrimary={true}
      onUploadComplete={publicUrl => {
        console.log('Image uploaded:', publicUrl);
        // Update your form state with the new image URL
      }}
      onUploadError={error => {
        console.error('Upload failed:', error);
      }}
    />
  );
}
```

### Using the Service Directly

```typescript
import { imageUploadService } from '@/shared/services/imageUploadService';

// Upload an image
const result = await imageUploadService.uploadImage({
  file: myFile,
  eventId: 'event-123',
  isPrimary: true,
});
console.log('Public URL:', result.publicUrl);

// Get all images for an event
const images = await imageUploadService.getEventImages('event-123');

// Set an image as primary
await imageUploadService.setPrimaryImage(imageId, eventId);

// Delete an image
await imageUploadService.deleteImage(imageId);

// Get public URL for a storage path
const url = imageUploadService.getPublicUrl('events/123/image.jpg');
```

## Features

### Drag and Drop

Users can drag images directly onto the upload component.

### File Validation

- **Allowed types:** JPEG, PNG, WebP, GIF
- **Max size:** 5MB
- Validation happens before upload

### Image Metadata

The `event_images` table stores:

- `storage_path` - Path in storage bucket
- `file_name` - Original filename
- `file_size` - Size in bytes
- `mime_type` - Image MIME type
- `width` / `height` - Image dimensions (auto-detected)
- `is_primary` - Whether this is the hero image
- `uploaded_by` - User who uploaded it

### Security

Only these roles can upload/delete images:

- `admin`
- `developer`
- `organization_admin`

Anyone can view images (public bucket).

## Integration with Event Forms

When creating/editing events, you can integrate the image upload:

```tsx
// In your event form component
<div className='space-y-6'>
  <Label>Event Hero Image</Label>
  <FmImageUpload
    eventId={event.id}
    currentImageUrl={event.hero_image}
    isPrimary={true}
    onUploadComplete={url => {
      // Update form state
      setFormState(prev => ({ ...prev, heroImage: url }));
    }}
  />
</div>
```

## Storage Bucket Structure

Images are organized in the bucket like this:

```
event-images/
  events/
    {event-id}/
      {timestamp}-{random}.jpg
      {timestamp}-{random}.png
  misc/
    {timestamp}-{random}.jpg  (if no eventId provided)
```

## Database Schema

### event_images Table

| Column       | Type        | Description                            |
| ------------ | ----------- | -------------------------------------- |
| id           | UUID        | Primary key                            |
| event_id     | UUID        | Foreign key to events table (nullable) |
| storage_path | TEXT        | Path in storage bucket (unique)        |
| file_name    | TEXT        | Original filename                      |
| file_size    | INTEGER     | File size in bytes                     |
| mime_type    | TEXT        | Image MIME type                        |
| width        | INTEGER     | Image width in pixels (nullable)       |
| height       | INTEGER     | Image height in pixels (nullable)      |
| is_primary   | BOOLEAN     | Whether this is the primary/hero image |
| uploaded_by  | UUID        | User who uploaded (nullable)           |
| created_at   | TIMESTAMPTZ | Upload timestamp                       |
| updated_at   | TIMESTAMPTZ | Last update timestamp                  |

## API Reference

### imageUploadService

#### uploadImage(options)

Upload an image to Supabase Storage.

**Parameters:**

- `file: File` - The image file to upload
- `bucket?: string` - Storage bucket (default: 'event-images')
- `path?: string` - Custom storage path (optional)
- `eventId?: string` - Event ID to associate with (optional)
- `isPrimary?: boolean` - Mark as primary image (default: false)

**Returns:** `Promise<UploadImageResult>`

- `publicUrl: string` - Public URL of uploaded image
- `storagePath: string` - Path in storage bucket
- `imageId?: string` - Database record ID (if eventId provided)

#### deleteImage(imageId, bucket?)

Delete an image from storage and database.

#### getEventImages(eventId)

Get all images for an event, ordered by primary first.

#### setPrimaryImage(imageId, eventId)

Set an image as the primary hero image for an event.

#### getPublicUrl(storagePath, bucket?)

Get the public URL for a storage path.

## Troubleshooting

### Upload fails with "403 Forbidden"

- Check that your user has admin, developer, or organization_admin role
- Verify RLS policies are enabled on storage.objects

### Image doesn't display

- Verify the bucket is set to public
- Check the public URL is correct
- Ensure the image was uploaded successfully

### TypeScript errors about event_images

- Run the migration first
- Types will be generated after migration runs
- Type assertions `(as any)` are temporary until types update

## Future Enhancements

Possible improvements:

- Image resizing/optimization on upload
- Multiple image galleries per event
- Image cropping UI
- CDN integration
- Lazy loading for image lists
