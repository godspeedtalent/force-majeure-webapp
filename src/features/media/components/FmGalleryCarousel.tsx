/**
 * FmGalleryCarousel
 *
 * Reusable carousel component for displaying media gallery images.
 * Fetches images from a gallery by slug and displays them in an auto-scrolling carousel.
 *
 * Features a proximity-based edit button for admins/developers/gallery owners that
 * fades in as the cursor approaches, allowing quick access to gallery management.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music2, Pencil, Database } from 'lucide-react';
import { useGallery } from '../hooks/useGallery';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { ImageAnchor, ROLES } from '@/shared';
import { logger } from '@/shared/services/logger';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { useAuth } from '@/features/auth/services/AuthContext';
import { FmProximityIconButton } from '@/components/common/buttons/FmProximityIconButton';
import type { ContextMenuAction } from '@/components/common/modals/FmCommonContextMenu';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/common/shadcn/carousel';
import { cn } from '@/shared';
import type { GallerySlug } from '../types';

export interface FmGalleryCarouselProps {
  /** Gallery slug to fetch images from */
  gallerySlug: GallerySlug | string;
  /** Auto-scroll interval in milliseconds (default: 5000) */
  autoScrollInterval?: number;
  /** Whether to loop the carousel (default: true) */
  loop?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Custom class name for each slide */
  slideClassName?: string;
  /** Whether to show photo credits on hover */
  showCredits?: boolean;
  /** Credit label prefix (e.g., "Photo by") */
  creditPrefix?: string;
  /** Whether to show gradient overlays */
  showGradients?: boolean;
  /** Custom gradient overlays */
  gradientOverlays?: React.ReactNode;
  /** Loading placeholder content */
  loadingContent?: React.ReactNode;
  /** Empty state content (shown when gallery has no images) */
  emptyContent?: React.ReactNode;
  /** Image anchor position */
  imageAnchor?: ImageAnchor;
  /** Callback when carousel API is ready */
  onApiReady?: (api: CarouselApi) => void;
  /** Whether to show the edit button for authorized users (default: true) */
  showEditButton?: boolean;
  /** Fade radius for the proximity edit button (default: '90vh') */
  editButtonFadeRadius?: string;
  /** Owner user ID - if provided, this user can also edit the gallery */
  ownerUserId?: string;
}

export const FmGalleryCarousel = ({
  gallerySlug,
  autoScrollInterval = 5000,
  loop = true,
  className,
  slideClassName,
  showCredits = true,
  creditPrefix = 'Photo by',
  showGradients = true,
  gradientOverlays,
  loadingContent,
  emptyContent,
  imageAnchor = ImageAnchor.CENTER,
  onApiReady,
  showEditButton = true,
  editButtonFadeRadius = '90vh',
  ownerUserId,
}: FmGalleryCarouselProps) => {
  const navigate = useNavigate();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isHovering, setIsHovering] = useState(false);

  const { items, isLoading } = useGallery(gallerySlug);
  const { hasAnyRole } = useUserPermissions();
  const { user } = useAuth();

  // Determine if the user can edit this gallery
  const canEditGallery = useMemo(() => {
    if (!showEditButton) return false;

    // Check if user is admin or developer
    const isAdminOrDev = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER);
    if (isAdminOrDev) return true;

    // Check if user is the gallery owner
    if (ownerUserId && user?.id === ownerUserId) return true;

    return false;
  }, [showEditButton, hasAnyRole, ownerUserId, user?.id]);

  // Check if user is developer (for context menu with database navigator option)
  const isDeveloper = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER);

  // Context menu actions for developers
  const contextMenuActions = useMemo<ContextMenuAction<void>[]>(() => {
    if (!isDeveloper) return [];

    return [
      {
        label: 'Open in Database Navigator',
        icon: <Database className='h-4 w-4' />,
        onClick: () => {
          // Navigate to database navigator with gallery pre-selected
          // This opens the FmToolbar's Database tab with gallery management
          navigate(`/admin/galleries/${gallerySlug}?source=navigator`);
        },
      },
    ];
  }, [isDeveloper, gallerySlug, navigate]);

  // Handle edit button click
  const handleEditClick = () => {
    navigate(`/admin/galleries/${gallerySlug}`);
  };

  // Debug log gallery items and URLs
  useEffect(() => {
    if (items.length > 0) {
      logger.info('FmGalleryCarousel: Gallery items loaded', {
        gallerySlug,
        itemCount: items.length,
        items: items.map(item => ({
          id: item.id,
          file_path: item.file_path,
          url: item.url,
        })),
        source: 'FmGalleryCarousel',
      });
    }
  }, [items, gallerySlug]);

  // Set up auto-scroll
  useEffect(() => {
    if (!carouselApi || autoScrollInterval <= 0) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [carouselApi, autoScrollInterval]);

  // Notify parent when API is ready
  useEffect(() => {
    if (carouselApi && onApiReady) {
      onApiReady(carouselApi);
    }
  }, [carouselApi, onApiReady]);

  // Default loading content
  const defaultLoadingContent = (
    <CarouselItem className='relative h-full p-0 basis-full pl-0'>
      <div className='w-full h-full bg-gradient-to-br from-black via-fm-navy/30 to-black flex items-center justify-center'>
        <div className='text-center space-y-[20px]'>
          <Music2 className='h-32 w-32 text-fm-gold/20 mx-auto animate-pulse' />
          <p className='font-canela text-muted-foreground text-sm uppercase tracking-wider'>
            Loading...
          </p>
        </div>
      </div>
    </CarouselItem>
  );

  // Default empty content
  const defaultEmptyContent = (
    <CarouselItem className='relative h-full p-0 basis-full pl-0'>
      <div className='w-full h-full bg-gradient-to-br from-black via-fm-navy/30 to-black flex items-center justify-center'>
        <div className='text-center space-y-[20px]'>
          <Music2 className='h-32 w-32 text-fm-gold/20 mx-auto' />
          <p className='font-canela text-muted-foreground text-sm uppercase tracking-wider'>
            No images available
          </p>
        </div>
      </div>
    </CarouselItem>
  );

  // Default gradient overlays
  const defaultGradientOverlays = (
    <>
      <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent' />
      <div className='absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/60 lg:hidden' />
      <div className='absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent hidden lg:block' />
    </>
  );

  return (
    <div
      className={cn('h-full w-full relative', className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Proximity edit button for authorized users */}
      {canEditGallery && (
        <FmProximityIconButton
          icon={Pencil}
          variant='default'
          size='sm'
          tooltip='Edit gallery'
          fadeRadius={editButtonFadeRadius}
          onClick={handleEditClick}
          contextMenuActions={contextMenuActions}
          positionClassName='absolute top-[20px] left-[20px] z-10'
        />
      )}

      <Carousel
        setApi={setCarouselApi}
        opts={{
          loop,
          align: 'center',
        }}
        className='h-full w-full [&>div]:h-full'
      >
        <CarouselContent className='h-full ml-0 [&>div]:h-full'>
          {isLoading ? (
            loadingContent || defaultLoadingContent
          ) : items.length === 0 ? (
            emptyContent || defaultEmptyContent
          ) : (
            items.map(item => (
              <CarouselItem
                key={item.id}
                className={cn(
                  'relative h-full p-0 basis-full pl-0',
                  slideClassName
                )}
              >
                <ImageWithSkeleton
                  src={item.url}
                  alt={item.alt_text || 'Gallery image'}
                  className='w-full h-full object-cover'
                  skeletonClassName='bg-black/40 backdrop-blur-sm'
                  anchor={imageAnchor}
                />

                {/* Gradient overlays */}
                {showGradients && (gradientOverlays || defaultGradientOverlays)}

                {/* Photo credit on hover */}
                {showCredits && isHovering && item.creator && (
                  <div className='absolute bottom-[20px] right-[20px] bg-black/70 backdrop-blur-md px-[15px] py-[8px] border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-300'>
                    <p className='font-canela text-xs text-muted-foreground'>
                      {creditPrefix} {item.creator}
                    </p>
                  </div>
                )}
              </CarouselItem>
            ))
          )}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default FmGalleryCarousel;
