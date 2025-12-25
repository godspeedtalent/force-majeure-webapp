import { Skeleton } from '@/components/common/shadcn/skeleton';
import { cn } from '@/shared';

interface FmArtistCardSkeletonProps {
  /**
   * Whether to show the full preview card layout (with press images and social links)
   */
  variant?: 'simple' | 'preview';
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * FmArtistCardSkeleton - A skeleton placeholder for artist cards.
 *
 * Supports two variants:
 * - 'simple': Basic artist card with image, name, and genre
 * - 'preview': Full preview layout matching ArtistPreviewCard with press images and social links
 *
 * @example
 * // Simple artist card skeleton
 * <FmArtistCardSkeleton variant="simple" />
 *
 * @example
 * // Full preview skeleton
 * <FmArtistCardSkeleton variant="preview" />
 */
export const FmArtistCardSkeleton = ({
  variant = 'simple',
  className,
}: FmArtistCardSkeletonProps) => {
  if (variant === 'simple') {
    return (
      <div
        className={cn(
          'bg-black/60 backdrop-blur-md border border-white/20 rounded-none p-4',
          className
        )}
      >
        <div className='flex items-center gap-4'>
          {/* Profile image */}
          <Skeleton className='w-16 h-16 rounded-none flex-shrink-0' />
          <div className='flex-1 space-y-2'>
            {/* Name */}
            <Skeleton className='h-5 w-32 rounded-none' />
            {/* Genre badge */}
            <Skeleton className='h-5 w-20 rounded-none' />
          </div>
        </div>
      </div>
    );
  }

  // Preview variant - matches ArtistPreviewCard layout
  return (
    <div
      className={cn(
        'bg-black/60 backdrop-blur-md border border-white/20 rounded-none p-[30px]',
        className
      )}
    >
      <div className='flex flex-col gap-6 sm:flex-row sm:items-stretch'>
        {/* Left: Image Column */}
        <div className='w-full sm:w-48 flex-shrink-0 flex flex-col gap-[10px]'>
          <div className='flex flex-row gap-[10px] sm:flex-col'>
            {/* Main Profile Image */}
            <div className='flex-1 sm:flex-none overflow-hidden rounded-xl border border-white/15 bg-white/5'>
              <Skeleton className='aspect-[3/4] w-full rounded-none' />
            </div>

            {/* Additional Photos */}
            <div className='flex flex-col justify-between gap-[5px] w-16 sm:w-full sm:flex-row sm:gap-[10px]'>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className='aspect-square flex-1 rounded-lg'
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Content Column */}
        <div className='flex-1 flex flex-col gap-4 sm:min-h-[280px]'>
          <div className='space-y-2'>
            {/* Spotlight label */}
            <Skeleton className='h-3 w-20 rounded-none' />
            {/* Artist name */}
            <Skeleton className='h-7 w-48 rounded-none' />
            {/* Divider */}
            <div className='w-full h-[1px] bg-white/30' />
          </div>

          {/* Bio */}
          <div className='space-y-2'>
            <Skeleton className='h-4 w-full rounded-none' />
            <Skeleton className='h-4 w-full rounded-none' />
            <Skeleton className='h-4 w-3/4 rounded-none' />
          </div>

          {/* Genre badges */}
          <div className='flex gap-2 mt-auto'>
            <Skeleton className='h-6 w-20 rounded-none' />
            <Skeleton className='h-6 w-24 rounded-none' />
            <Skeleton className='h-6 w-16 rounded-none' />
          </div>
        </div>
      </div>

      {/* Social Media Links */}
      <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mt-[20px]' />
      <div className='flex items-center justify-between mt-[15px]'>
        <div className='flex items-center gap-[15px]'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className='w-10 h-10 rounded-none'
            />
          ))}
        </div>
        <div className='flex items-center gap-[10px]'>
          <Skeleton className='h-9 w-32 rounded-none' />
        </div>
      </div>
    </div>
  );
};

interface FmArtistListSkeletonProps {
  /**
   * Number of artist cards to render
   */
  count?: number;
  /**
   * Card variant
   */
  variant?: 'simple' | 'preview';
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * FmArtistListSkeleton - Multiple artist card skeletons for list loading state.
 *
 * @example
 * <FmArtistListSkeleton count={5} variant="simple" />
 */
export const FmArtistListSkeleton = ({
  count = 3,
  variant = 'simple',
  className,
}: FmArtistListSkeletonProps) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <FmArtistCardSkeleton key={index} variant={variant} />
      ))}
    </div>
  );
};
