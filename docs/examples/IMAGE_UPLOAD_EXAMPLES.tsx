/**
 * Example: Integrating FmImageUpload into Event Forms
 * 
 * This shows how to add image upload to event create/edit forms.
 */

import { useState } from 'react';
import { FmImageUpload } from '@/components/common/forms';
import { Label } from '@/components/common/shadcn/label';

// Example 1: In EventDetailsSection (existing component)
export function EventDetailsSectionWithImageUpload({ event, onImageChange }: any) {
  return (
    <div className="space-y-6">
      {/* Existing form fields... */}
      
      {/* Add image upload */}
      <div className="space-y-2">
        <Label htmlFor="hero-image">Event Hero Image</Label>
        <FmImageUpload
          eventId={event?.id}
          currentImageUrl={event?.hero_image}
          isPrimary={true}
          onUploadComplete={(publicUrl) => {
            // Update form state with new image URL
            onImageChange?.(publicUrl);
          }}
          onUploadError={(error) => {
            console.error('Image upload failed:', error);
          }}
        />
      </div>
    </div>
  );
}

// Example 2: Standalone usage in a custom form
export function EventImageManager() {
  const [eventId] = useState('some-event-id');
  const [heroImageUrl, setHeroImageUrl] = useState<string | undefined>();
  
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-canela">Manage Event Images</h2>
      
      <FmImageUpload
        eventId={eventId}
        currentImageUrl={heroImageUrl}
        isPrimary={true}
        onUploadComplete={(url) => {
          setHeroImageUrl(url);
          console.log('New image URL:', url);
          // You could also update the event in Supabase here
          // await updateEvent(eventId, { hero_image: url });
        }}
      />
      
      {heroImageUrl && (
        <div className="text-sm text-muted-foreground">
          Current image: {heroImageUrl}
        </div>
      )}
    </div>
  );
}

// Example 3: Integration with existing useEventForm hook
/*
In your event form component:

import { FmImageUpload } from '@/components/common/forms';

function EventFormComponent() {
  const { formState, setFormState } = useEventData();
  
  return (
    <div>
      {/* ... other fields ... *\/}
      
      <FmImageUpload
        eventId={formState.eventId}
        currentImageUrl={formState.heroImage}
        isPrimary={true}
        onUploadComplete={(url) => {
          setFormState(prev => ({
            ...prev,
            heroImage: url
          }));
        }}
      />
    </div>
  );
}
*/

// Example 4: Multiple images for an event
export function EventImageGallery({ eventId }: { eventId: string }) {
  const [images, setImages] = useState<string[]>([]);
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-canela">Event Image Gallery</h3>
      
      {/* Hero/Primary Image */}
      <div>
        <Label>Primary Image</Label>
        <FmImageUpload
          eventId={eventId}
          isPrimary={true}
          onUploadComplete={(url) => {
            console.log('Primary image uploaded:', url);
          }}
        />
      </div>
      
      {/* Additional Images */}
      <div>
        <Label>Additional Images</Label>
        <FmImageUpload
          eventId={eventId}
          isPrimary={false}
          onUploadComplete={(url) => {
            setImages(prev => [...prev, url]);
          }}
        />
      </div>
      
      {/* Display uploaded images */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`Event image ${index + 1}`}
              className="aspect-video object-cover rounded-lg"
            />
          ))}
        </div>
      )}
    </div>
  );
}
