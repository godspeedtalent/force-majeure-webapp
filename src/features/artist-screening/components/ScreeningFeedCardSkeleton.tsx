/**
 * Screening Feed Card Skeleton
 *
 * Loading placeholder for the compact ScreeningFeedCard component.
 * Matches the layout dimensions for smooth transitions.
 */

import { cn } from '@/shared';

interface ScreeningFeedCardSkeletonProps {
  className?: string;
}

const shimmer = 'animate-pulse bg-white/10';

export function ScreeningFeedCardSkeleton({
  className,
}: ScreeningFeedCardSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-black/60 backdrop-blur-sm border border-white/10',
        'max-w-2xl mx-auto',
        className
      )}
    >
      {/* Main Content Row */}
      <div className="flex gap-[15px] p-[15px]">
        {/* Square Album Art */}
        <div className={cn('w-24 h-24 md:w-32 md:h-32 flex-shrink-0', shimmer)} />

        {/* Info Column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-[10px] mb-[5px]">
            <div className="min-w-0 flex-1">
              <div className={cn('h-4 w-28 mb-[4px]', shimmer)} />
              <div className={cn('h-3 w-20', shimmer)} />
            </div>
            <div className={cn('h-4 w-14 flex-shrink-0', shimmer)} />
          </div>

          {/* DJ Set Title */}
          <div className={cn('h-4 w-3/4 mb-[8px]', shimmer)} />

          {/* Genre Badges */}
          <div className="flex gap-[4px] mb-[8px]">
            <div className={cn('h-5 w-14', shimmer)} />
            <div className={cn('h-5 w-16', shimmer)} />
            <div className={cn('h-5 w-12 hidden md:block', shimmer)} />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-[12px] mt-auto">
            <div className={cn('h-5 w-8', shimmer)} />
            <div className={cn('h-4 w-6', shimmer)} />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-[15px] py-[10px] border-t border-white/10 flex items-center gap-[8px]">
        <div className={cn('h-7 w-16', shimmer)} />
        <div className={cn('h-7 w-7', shimmer)} />
        <div className={cn('h-7 w-7 ml-auto', shimmer)} />
      </div>
    </div>
  );
}

/**
 * Multiple skeleton cards for initial loading state
 */
export function ScreeningFeedSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-[10px] md:space-y-[15px] px-[10px] md:px-0">
      {Array.from({ length: count }).map((_, i) => (
        <ScreeningFeedCardSkeleton key={i} />
      ))}
    </div>
  );
}
