/**
 * Media Feature
 *
 * Provides a flexible media gallery system for managing and displaying
 * images, videos, and audio organized into galleries.
 */

// Types
export type {
  MediaType,
  MediaGallery,
  MediaItem,
  ResolvedMediaItem,
  GalleryFilterOptions,
  GallerySlug,
} from './types';

export { GALLERY_SLUGS } from './types';

// Hooks
export { useGallery } from './hooks/useGallery';
export { useGalleryManagement } from './hooks/useGalleryManagement';

// Components
export { FmGalleryCarousel } from './components/FmGalleryCarousel';
export type { FmGalleryCarouselProps } from './components/FmGalleryCarousel';
