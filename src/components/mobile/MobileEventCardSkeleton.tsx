import { cn } from '@/shared';

export interface MobileEventCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton placeholder for MobileEventFullCard
 * Used during loading states to prevent layout shift
 */
export function MobileEventCardSkeleton({ className }: MobileEventCardSkeletonProps) {
  return (
    <div
      className={cn(
        'relative flex-1 w-full',
        'flex flex-col',
        'overflow-hidden',
        'bg-background',
        className
      )}
    >
      {/* Hero Image Skeleton - fills available space */}
      <div className='absolute inset-0 w-full h-full pt-[64px]'>
        <div className='h-full w-full bg-muted/20 animate-pulse' />

        {/* Gradient Overlay */}
        <div
          className={cn(
            'absolute inset-0',
            'bg-gradient-to-t from-black via-black/50 to-transparent'
          )}
        />
      </div>

      {/* Content Skeleton - anchored to bottom */}
      <div className='relative z-10 mt-auto p-[20px] pb-[100px]'>
        <div className='flex items-end gap-[20px]'>
          {/* Event Info Skeleton - Left Side */}
          <div className='flex-1 min-w-0 space-y-[10px]'>
            {/* Title Skeleton */}
            <div className='h-9 w-3/4 bg-muted/30 animate-pulse' />

            {/* Undercard Skeleton */}
            <div className='h-5 w-1/2 bg-muted/20 animate-pulse' />

            {/* Venue Skeleton */}
            <div className='flex items-center gap-2 mb-[20px]'>
              <div className='w-4 h-4 bg-fm-gold/30 animate-pulse' />
              <div className='h-4 w-32 bg-muted/20 animate-pulse' />
            </div>

            {/* Button Skeleton */}
            <div className='h-10 w-full bg-fm-gold/20 animate-pulse' />
          </div>

          {/* Date Box Skeleton - Right Side */}
          <div className='flex-shrink-0 w-24 h-28 bg-muted/20 border border-border/50 animate-pulse' />
        </div>
      </div>
    </div>
  );
}
