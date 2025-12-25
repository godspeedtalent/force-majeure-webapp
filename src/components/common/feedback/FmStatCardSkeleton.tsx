import { Skeleton } from '@/components/common/shadcn/skeleton';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader } from '@/components/common/display/FmCommonCard';
import { cn } from '@/shared';

interface FmStatCardSkeletonProps {
  /**
   * Whether to show subtitle placeholder
   */
  showSubtitle?: boolean;
  /**
   * Whether to show trend indicator placeholder
   */
  showTrend?: boolean;
  /**
   * Additional className for the card
   */
  className?: string;
}

/**
 * FmStatCardSkeleton - A skeleton placeholder for analytics stat cards.
 *
 * Mirrors the layout of AnalyticsStatCard with title, value, icon,
 * optional subtitle, and optional trend indicator.
 *
 * @example
 * // Basic usage
 * <FmStatCardSkeleton />
 *
 * @example
 * // With subtitle and trend
 * <FmStatCardSkeleton showSubtitle showTrend />
 */
export const FmStatCardSkeleton = ({
  showSubtitle = false,
  showTrend = false,
  className,
}: FmStatCardSkeletonProps) => {
  return (
    <FmCommonCard className={className}>
      <FmCommonCardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        {/* Title */}
        <Skeleton className='h-4 w-24 rounded-none' />
        {/* Icon */}
        <Skeleton className='h-4 w-4 rounded-none' />
      </FmCommonCardHeader>
      <FmCommonCardContent>
        {/* Value */}
        <Skeleton className='h-8 w-32 rounded-none' />
        {showSubtitle && (
          <Skeleton className='h-3 w-28 rounded-none mt-1' />
        )}
        {showTrend && (
          <Skeleton className='h-3 w-36 rounded-none mt-1' />
        )}
      </FmCommonCardContent>
    </FmCommonCard>
  );
};

interface FmStatGridSkeletonProps {
  /**
   * Number of stat cards to render
   */
  count?: number;
  /**
   * Number of columns in the grid (responsive)
   */
  columns?: 2 | 3 | 4;
  /**
   * Whether cards should show subtitle
   */
  showSubtitle?: boolean;
  /**
   * Whether cards should show trend
   */
  showTrend?: boolean;
  /**
   * Additional className for the grid container
   */
  className?: string;
}

/**
 * FmStatGridSkeleton - A grid of stat card skeletons for dashboard loading states.
 *
 * @example
 * // 4 cards in a responsive grid
 * <FmStatGridSkeleton count={4} columns={4} />
 *
 * @example
 * // 3 cards with subtitles
 * <FmStatGridSkeleton count={3} columns={3} showSubtitle />
 */
export const FmStatGridSkeleton = ({
  count = 4,
  columns = 4,
  showSubtitle = false,
  showTrend = false,
  className,
}: FmStatGridSkeletonProps) => {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid grid-cols-1 gap-4', gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, index) => (
        <FmStatCardSkeleton
          key={index}
          showSubtitle={showSubtitle}
          showTrend={showTrend}
        />
      ))}
    </div>
  );
};
