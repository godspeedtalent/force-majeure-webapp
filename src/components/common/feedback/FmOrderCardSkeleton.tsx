import { Skeleton } from '@/components/common/shadcn/skeleton';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader } from '@/components/common/display/FmCommonCard';
import { Separator } from '@/components/common/shadcn/separator';
import { cn } from '@/shared';

interface FmOrderCardSkeletonProps {
  /**
   * Additional className for the card
   */
  className?: string;
}

/**
 * FmOrderCardSkeleton - A skeleton placeholder for order cards.
 *
 * Mirrors the layout of order cards in Orders.tsx with event title,
 * date, status badge, order items, and totals sections.
 *
 * @example
 * // Single skeleton
 * <FmOrderCardSkeleton />
 *
 * @example
 * // Multiple skeletons for loading state
 * {Array.from({ length: 3 }).map((_, i) => (
 *   <FmOrderCardSkeleton key={i} />
 * ))}
 */
export const FmOrderCardSkeleton = ({ className }: FmOrderCardSkeletonProps) => {
  return (
    <FmCommonCard className={className}>
      <FmCommonCardHeader>
        <div className='flex items-start justify-between'>
          <div className='flex-1 space-y-2'>
            {/* Event title */}
            <Skeleton className='h-6 w-48 rounded-none' />
            {/* Date and time */}
            <div className='flex items-center gap-4'>
              <Skeleton className='h-4 w-4 rounded-none' />
              <Skeleton className='h-4 w-32 rounded-none' />
              <Skeleton className='h-4 w-16 rounded-none' />
            </div>
          </div>
          {/* Status badge */}
          <Skeleton className='h-6 w-24 rounded-none' />
        </div>
      </FmCommonCardHeader>
      <FmCommonCardContent className='space-y-4'>
        <Separator />

        {/* Order Items */}
        <div className='space-y-2'>
          <Skeleton className='h-4 w-16 rounded-none' />
          {/* Item rows */}
          <div className='flex justify-between'>
            <Skeleton className='h-4 w-32 rounded-none' />
            <Skeleton className='h-4 w-16 rounded-none' />
          </div>
          <div className='flex justify-between'>
            <Skeleton className='h-4 w-28 rounded-none' />
            <Skeleton className='h-4 w-16 rounded-none' />
          </div>
        </div>

        <Separator />

        {/* Order Totals */}
        <div className='space-y-1'>
          <div className='flex justify-between'>
            <Skeleton className='h-4 w-16 rounded-none' />
            <Skeleton className='h-4 w-16 rounded-none' />
          </div>
          <div className='flex justify-between'>
            <Skeleton className='h-4 w-12 rounded-none' />
            <Skeleton className='h-4 w-14 rounded-none' />
          </div>
          <Separator className='my-2' />
          <div className='flex justify-between'>
            <Skeleton className='h-5 w-12 rounded-none' />
            <Skeleton className='h-5 w-20 rounded-none' />
          </div>
        </div>

        {/* Order date */}
        <Skeleton className='h-3 w-48 rounded-none' />
      </FmCommonCardContent>
    </FmCommonCard>
  );
};

interface FmOrderListSkeletonProps {
  /**
   * Number of order cards to render
   */
  count?: number;
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * FmOrderListSkeleton - Multiple order card skeletons for list loading state.
 *
 * @example
 * <FmOrderListSkeleton count={5} />
 */
export const FmOrderListSkeleton = ({
  count = 3,
  className,
}: FmOrderListSkeletonProps) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <FmOrderCardSkeleton key={index} />
      ))}
    </div>
  );
};
