import { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared';
import { createPortal } from 'react-dom';

export interface LightboxImage {
  /** Image URL */
  url: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Image title */
  title?: string;
  /** Image description */
  description?: string;
  /** Creator/photographer name */
  creator?: string;
  /** Year the image was taken */
  year?: number | string;
}

export interface FmCommonLightboxProps {
  /** Array of images to display */
  images: LightboxImage[];
  /** Currently selected image index */
  currentIndex: number;
  /** Whether the lightbox is open */
  isOpen: boolean;
  /** Callback when lightbox should close */
  onClose: () => void;
  /** Callback when image index changes */
  onIndexChange?: (index: number) => void;
  /** Whether to show navigation arrows (default: true when multiple images) */
  showNavigation?: boolean;
  /** Whether to show image captions (default: true) */
  showCaptions?: boolean;
  /** Credit label prefix (default: "Photo by") */
  creditPrefix?: string;
}

/**
 * FmCommonLightbox - A fullscreen image lightbox with captions
 *
 * Features:
 * - Fullscreen overlay with frosted glass effect
 * - Click outside or X to close
 * - Keyboard navigation (Escape to close, arrows to navigate)
 * - Optional navigation arrows for multiple images
 * - Caption system showing title, description, creator, and year
 * - Smooth animations
 */
export const FmCommonLightbox = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
  showNavigation = true,
  showCaptions = true,
  creditPrefix = 'Photo by',
}: FmCommonLightboxProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;
  const canNavigate = showNavigation && hasMultipleImages;

  // Navigate to previous image
  const goToPrevious = useCallback(() => {
    if (!canNavigate || isAnimating) return;
    setIsAnimating(true);
    const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    onIndexChange?.(newIndex);
    setTimeout(() => setIsAnimating(false), 300);
  }, [canNavigate, currentIndex, images.length, onIndexChange, isAnimating]);

  // Navigate to next image
  const goToNext = useCallback(() => {
    if (!canNavigate || isAnimating) return;
    setIsAnimating(true);
    const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    onIndexChange?.(newIndex);
    setTimeout(() => setIsAnimating(false), 300);
  }, [canNavigate, currentIndex, images.length, onIndexChange, isAnimating]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !currentImage) return null;

  const hasCaption =
    currentImage.title ||
    currentImage.description ||
    currentImage.creator ||
    currentImage.year;

  const lightboxContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'animate-in fade-in duration-200'
      )}
      role='dialog'
      aria-modal='true'
      aria-label='Image lightbox'
    >
      {/* Backdrop - click to close */}
      <div
        className='absolute inset-0 bg-black/80 backdrop-blur-md'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Close button */}
      <button
        type='button'
        onClick={onClose}
        className={cn(
          'absolute top-4 right-4 z-10',
          'p-2 bg-black/60 backdrop-blur-sm border border-white/20',
          'text-white/70 hover:text-white hover:bg-black/80',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-fm-gold/50'
        )}
        aria-label='Close lightbox'
      >
        <X className='h-6 w-6' />
      </button>

      {/* Previous button */}
      {canNavigate && (
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className={cn(
            'absolute left-4 top-1/2 -translate-y-1/2 z-10',
            'p-3 bg-black/60 backdrop-blur-sm border border-white/20',
            'text-white/70 hover:text-white hover:bg-black/80',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-fm-gold/50'
          )}
          aria-label='Previous image'
        >
          <ChevronLeft className='h-6 w-6' />
        </button>
      )}

      {/* Next button */}
      {canNavigate && (
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className={cn(
            'absolute right-4 top-1/2 -translate-y-1/2 z-10',
            'p-3 bg-black/60 backdrop-blur-sm border border-white/20',
            'text-white/70 hover:text-white hover:bg-black/80',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-fm-gold/50'
          )}
          aria-label='Next image'
        >
          <ChevronRight className='h-6 w-6' />
        </button>
      )}

      {/* Image container */}
      <div
        className='relative max-w-[90vw] max-h-[85vh] flex flex-col items-center'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main image */}
        <img
          src={currentImage.url}
          alt={currentImage.alt || currentImage.title || 'Gallery image'}
          className={cn(
            'max-w-full max-h-[75vh] object-contain',
            'border border-white/10 shadow-2xl',
            'animate-in fade-in zoom-in-95 duration-300'
          )}
        />

        {/* Caption */}
        {showCaptions && hasCaption && (
          <div
            className={cn(
              'mt-4 max-w-[600px] w-full',
              'bg-black/80 backdrop-blur-lg border border-fm-gold/20',
              'shadow-[0_4px_20px_rgba(0,0,0,0.5)]',
              'animate-in fade-in slide-in-from-bottom-2 duration-300'
            )}
          >
            <div className='px-5 py-3'>
              {/* Title */}
              {currentImage.title && (
                <h4 className='font-canela text-sm text-white font-medium'>
                  {currentImage.title}
                </h4>
              )}

              {/* Description */}
              {currentImage.description && (
                <p className='font-canela text-xs text-white/60 mt-1 leading-relaxed'>
                  {currentImage.description}
                </p>
              )}

              {/* Creator/Year divider */}
              {(currentImage.creator || currentImage.year) && (
                <div className='border-t border-white/20 mt-3 pt-3'>
                  <p className='font-canela text-[10px] text-white/50'>
                    {creditPrefix} {currentImage.creator}
                    {currentImage.year && ` ${currentImage.year}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image counter */}
        {hasMultipleImages && (
          <div className='mt-3 text-xs text-white/50 font-canela'>
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );

  // Render in portal to ensure it's above everything
  return createPortal(lightboxContent, document.body);
};
