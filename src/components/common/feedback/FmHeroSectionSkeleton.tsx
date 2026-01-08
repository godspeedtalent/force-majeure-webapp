/**
 * FmHeroSectionSkeleton
 *
 * A reusable skeleton loading component for hero sections.
 * Supports different layouts: with gallery, without gallery, or auto-detect.
 * Used while waiting for data like gallery images to load.
 */

import { Skeleton } from '@/components/common/shadcn/skeleton';
import { cn, useIsMobile } from '@/shared';

export interface FmHeroSectionSkeletonProps {
  /** Layout variant - 'with-gallery' shows two columns, 'single' shows one hero image */
  variant?: 'with-gallery' | 'single' | 'auto';
  /** Show the spotlight header text skeleton */
  showHeader?: boolean;
  /** Show social links skeleton */
  showSocialLinks?: boolean;
  /** Show bio section skeleton */
  showBio?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * FmHeroSectionSkeleton - Skeleton placeholder for hero/spotlight sections.
 *
 * Mirrors layouts like FmArtistSpotlight with support for gallery grids.
 *
 * @example
 * // Basic usage - auto layout
 * <FmHeroSectionSkeleton />
 *
 * @example
 * // With gallery layout
 * <FmHeroSectionSkeleton variant="with-gallery" showSocialLinks />
 */
export function FmHeroSectionSkeleton({
  variant = 'auto',
  showHeader = true,
  showSocialLinks = true,
  showBio = true,
  className,
}: FmHeroSectionSkeletonProps) {
  const isMobile = useIsMobile();

  // Auto variant defaults to with-gallery on desktop, single on mobile
  const effectiveVariant = variant === 'auto'
    ? (isMobile ? 'single' : 'with-gallery')
    : variant;

  return (
    <div className={cn('w-full', className)}>
      {/* Spotlight Card */}
      <div className='bg-black/60 backdrop-blur-md border border-white/20 rounded-none p-4 md:p-[30px]'>
        {/* Mobile: Header at top */}
        {showHeader && (
          <div className='md:hidden flex justify-center mb-3'>
            <Skeleton className='h-3 w-24 rounded-none' />
          </div>
        )}

        {/* Mobile Layout */}
        <div className='md:hidden'>
          {effectiveVariant === 'with-gallery' ? (
            /* Mobile with gallery: Two columns */
            <div className='flex gap-2'>
              {/* Main image skeleton */}
              <div className='w-1/2 flex-shrink-0'>
                <div className='relative overflow-hidden border border-white/15 bg-white/5'>
                  <Skeleton className='w-full aspect-[3/4] rounded-none' />
                  {/* Overlay info skeleton */}
                  <div className='absolute bottom-0 left-0 right-0 p-2 bg-black/40'>
                    <Skeleton className='h-4 w-24 rounded-none mb-1' />
                    <div className='flex items-center gap-1'>
                      <Skeleton className='h-2.5 w-2.5 rounded-none' />
                      <Skeleton className='h-3 w-16 rounded-none' />
                    </div>
                  </div>
                </div>
              </div>

              {/* Thumbnail grid skeleton */}
              <div className='w-1/2 flex flex-col'>
                <div className='grid grid-cols-2 gap-1.5'>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className='aspect-square rounded-none' />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Mobile without gallery: Horizontal hero */
            <div className='relative overflow-hidden border border-white/15 bg-white/5'>
              <Skeleton className='w-full aspect-[16/9] rounded-none' />
              {/* Overlay info skeleton */}
              <div className='absolute bottom-0 left-0 right-0 p-3 bg-black/40'>
                <Skeleton className='h-5 w-32 rounded-none mb-1' />
                <div className='flex items-center gap-1'>
                  <Skeleton className='h-3 w-3 rounded-none' />
                  <Skeleton className='h-3 w-20 rounded-none' />
                </div>
              </div>
            </div>
          )}

          {/* Mobile: Bio section */}
          {showBio && (
            <div className='mt-3 pt-3 border-t border-white/10 space-y-2'>
              <Skeleton className='h-3 w-full rounded-none' />
              <Skeleton className='h-3 w-full rounded-none' />
              <Skeleton className='h-3 w-3/4 rounded-none' />
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className='hidden md:flex gap-5'>
          {/* Left Column - Main Image */}
          <div className='w-1/2 flex-shrink-0'>
            <div className='relative overflow-hidden border border-white/15 bg-white/5'>
              <Skeleton className='w-full aspect-[3/4] rounded-none' />
              {/* Overlay info skeleton */}
              <div className='absolute bottom-0 left-0 right-0 p-4 bg-black/50'>
                {showHeader && <Skeleton className='h-2 w-20 rounded-none mb-2' />}
                <Skeleton className='h-6 w-40 rounded-none mb-2' />
                <div className='flex items-center gap-1.5'>
                  <Skeleton className='h-3.5 w-3.5 rounded-none' />
                  <Skeleton className='h-4 w-24 rounded-none' />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Gallery or Bio */}
          <div className='w-1/2 flex flex-col'>
            {effectiveVariant === 'with-gallery' ? (
              <div className='grid grid-cols-3 gap-2'>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className='aspect-square rounded-none' />
                ))}
              </div>
            ) : (
              /* No gallery - show bio skeleton */
              <div className='px-2 space-y-2'>
                <Skeleton className='h-4 w-full rounded-none' />
                <Skeleton className='h-4 w-full rounded-none' />
                <Skeleton className='h-4 w-full rounded-none' />
                <Skeleton className='h-4 w-2/3 rounded-none' />
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Bio Section - only for gallery variant */}
        {showBio && effectiveVariant === 'with-gallery' && (
          <div className='hidden md:block mt-5 pt-5 border-t border-white/10 px-4 space-y-2'>
            <Skeleton className='h-4 w-full rounded-none' />
            <Skeleton className='h-4 w-full rounded-none' />
            <Skeleton className='h-4 w-3/4 rounded-none' />
          </div>
        )}

        {/* Social Links */}
        {showSocialLinks && (
          <>
            <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mt-4 md:mt-[20px]' />
            <div className='flex items-center gap-3 mt-3 md:mt-[15px]'>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className='h-8 w-8 rounded-none' />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
