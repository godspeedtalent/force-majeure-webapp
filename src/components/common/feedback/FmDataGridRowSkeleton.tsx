import { Skeleton } from '@/components/common/shadcn/skeleton';
import { cn } from '@/shared';

interface FmDataGridRowSkeletonProps {
  /**
   * Number of columns to render skeleton cells for
   */
  columns?: number;
  /**
   * Whether this is a header row (slightly different styling)
   */
  isHeader?: boolean;
  /**
   * Additional className for the row container
   */
  className?: string;
}

/**
 * FmDataGridRowSkeleton - A skeleton placeholder for data grid rows.
 *
 * Mirrors the layout of FmDataGrid rows with configurable column count.
 * Use this component when loading data for FmConfigurableDataGrid or FmDataGrid.
 *
 * @example
 * // Basic usage with 5 columns
 * <FmDataGridRowSkeleton columns={5} />
 *
 * @example
 * // Multiple rows
 * {Array.from({ length: 10 }).map((_, i) => (
 *   <FmDataGridRowSkeleton key={i} columns={6} />
 * ))}
 */
export const FmDataGridRowSkeleton = ({
  columns = 5,
  isHeader = false,
  className,
}: FmDataGridRowSkeletonProps) => {
  // Generate varying widths for a more natural look
  const getColumnWidth = (index: number): string => {
    const widths = ['w-16', 'w-24', 'w-32', 'w-20', 'w-28', 'w-36', 'w-14'];
    return widths[index % widths.length];
  };

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3 border-b border-border',
        isHeader && 'bg-muted/50',
        className
      )}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <div key={index} className='flex-1 min-w-0'>
          <Skeleton
            className={cn(
              'h-4 rounded-none',
              getColumnWidth(index),
              isHeader && 'h-3'
            )}
          />
        </div>
      ))}
      {/* Actions column placeholder */}
      <div className='flex-shrink-0 w-20'>
        <Skeleton className='h-8 w-8 rounded-none' />
      </div>
    </div>
  );
};

interface FmDataGridSkeletonProps {
  /**
   * Number of rows to render
   */
  rows?: number;
  /**
   * Number of columns per row
   */
  columns?: number;
  /**
   * Whether to show a header row
   */
  showHeader?: boolean;
  /**
   * Additional className for the container
   */
  className?: string;
}

/**
 * FmDataGridSkeleton - A complete data grid skeleton with header and rows.
 *
 * @example
 * // Basic usage
 * <FmDataGridSkeleton rows={10} columns={6} />
 *
 * @example
 * // Without header
 * <FmDataGridSkeleton rows={5} columns={4} showHeader={false} />
 */
export const FmDataGridSkeleton = ({
  rows = 10,
  columns = 5,
  showHeader = true,
  className,
}: FmDataGridSkeletonProps) => {
  return (
    <div className={cn('border border-border rounded-none bg-card', className)}>
      {showHeader && (
        <FmDataGridRowSkeleton columns={columns} isHeader className='bg-muted/30' />
      )}
      {Array.from({ length: rows }).map((_, index) => (
        <FmDataGridRowSkeleton key={index} columns={columns} />
      ))}
    </div>
  );
};
