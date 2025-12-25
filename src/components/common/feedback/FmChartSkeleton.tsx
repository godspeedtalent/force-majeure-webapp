import { Skeleton } from '@/components/common/shadcn/skeleton';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader } from '@/components/common/display/FmCommonCard';
import { cn } from '@/shared';

type ChartType = 'line' | 'bar' | 'pie' | 'area';

interface FmChartSkeletonProps {
  /**
   * Type of chart to simulate
   */
  type?: ChartType;
  /**
   * Height of the chart area
   */
  height?: number;
  /**
   * Whether to show the card wrapper with title
   */
  showCard?: boolean;
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * FmChartSkeleton - A skeleton placeholder for chart components.
 *
 * Supports different chart types with appropriate visual representations.
 *
 * @example
 * // Line chart skeleton
 * <FmChartSkeleton type="line" />
 *
 * @example
 * // Bar chart without card wrapper
 * <FmChartSkeleton type="bar" showCard={false} height={200} />
 */
export const FmChartSkeleton = ({
  type = 'line',
  height = 300,
  showCard = true,
  className,
}: FmChartSkeletonProps) => {
  const renderChartContent = () => {
    switch (type) {
      case 'bar':
        return (
          <div className='flex items-end justify-between gap-2 h-full px-4'>
            {Array.from({ length: 8 }).map((_, index) => {
              // Generate varying heights for bars
              const heights = [60, 80, 45, 90, 70, 55, 85, 40];
              return (
                <Skeleton
                  key={index}
                  className='flex-1 rounded-none'
                  style={{ height: `${heights[index % heights.length]}%` }}
                />
              );
            })}
          </div>
        );

      case 'pie':
        return (
          <div className='flex items-center justify-center h-full'>
            <Skeleton className='w-48 h-48 rounded-full' />
          </div>
        );

      case 'area':
      case 'line':
      default:
        return (
          <div className='relative h-full'>
            {/* Y-axis labels */}
            <div className='absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between'>
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className='h-3 w-8 rounded-none' />
              ))}
            </div>

            {/* Chart area with grid lines */}
            <div className='ml-14 mr-4 h-full relative'>
              {/* Horizontal grid lines */}
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className='absolute w-full border-t border-muted/30'
                  style={{ top: `${index * 20}%` }}
                />
              ))}

              {/* Simulated line/area shape */}
              <div className='absolute inset-0 flex items-end'>
                <svg className='w-full h-[80%]' preserveAspectRatio='none'>
                  <defs>
                    <linearGradient id='skeletonGradient' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='0%' stopColor='hsl(var(--muted))' stopOpacity='0.4' />
                      <stop offset='100%' stopColor='hsl(var(--muted))' stopOpacity='0.1' />
                    </linearGradient>
                  </defs>
                  {type === 'area' && (
                    <path
                      d='M0,80 Q50,60 100,70 T200,50 T300,65 T400,45 T500,55 L500,100 L0,100 Z'
                      fill='url(#skeletonGradient)'
                      className='animate-pulse'
                    />
                  )}
                  <path
                    d='M0,80 Q50,60 100,70 T200,50 T300,65 T400,45 T500,55'
                    fill='none'
                    stroke='hsl(var(--muted))'
                    strokeWidth='3'
                    className='animate-pulse'
                  />
                </svg>
              </div>

              {/* X-axis labels */}
              <div className='absolute bottom-0 left-0 right-0 flex justify-between'>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className='h-3 w-10 rounded-none' />
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  const chartContent = (
    <div style={{ height }} className='relative'>
      {renderChartContent()}
    </div>
  );

  if (!showCard) {
    return <div className={className}>{chartContent}</div>;
  }

  return (
    <FmCommonCard className={className}>
      <FmCommonCardHeader>
        <Skeleton className='h-6 w-40 rounded-none' />
      </FmCommonCardHeader>
      <FmCommonCardContent>{chartContent}</FmCommonCardContent>
    </FmCommonCard>
  );
};

interface FmChartGridSkeletonProps {
  /**
   * Number of charts to render
   */
  count?: number;
  /**
   * Number of columns in the grid
   */
  columns?: 1 | 2;
  /**
   * Chart types for each position (cycles if fewer than count)
   */
  types?: ChartType[];
  /**
   * Height of each chart
   */
  height?: number;
  /**
   * Additional className for the grid container
   */
  className?: string;
}

/**
 * FmChartGridSkeleton - A grid of chart skeletons for dashboard loading states.
 *
 * @example
 * // 4 charts in a 2-column grid
 * <FmChartGridSkeleton count={4} columns={2} />
 *
 * @example
 * // Mixed chart types
 * <FmChartGridSkeleton count={4} types={['line', 'bar', 'pie', 'area']} />
 */
export const FmChartGridSkeleton = ({
  count = 4,
  columns = 2,
  types = ['line', 'bar'],
  height = 300,
  className,
}: FmChartGridSkeletonProps) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
  };

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, index) => (
        <FmChartSkeleton
          key={index}
          type={types[index % types.length]}
          height={height}
        />
      ))}
    </div>
  );
};
