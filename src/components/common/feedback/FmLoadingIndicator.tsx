import { FmGoldenGridLoader } from './FmGoldenGridLoader';
import { FmLoadingProgressBar } from './FmLoadingProgressBar';
import { cn } from '@/shared';

export interface FmLoadingIndicatorProps {
  /** Optional loading message */
  message?: string;
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg';
  /** Show progress bar */
  showProgress?: boolean;
  /** Progress bar size */
  progressSize?: 'sm' | 'md' | 'lg';
  /** Optional class name for container */
  className?: string;
  /** Optional class name for message */
  messageClassName?: string;
  /** Optional class name for progress wrapper */
  progressClassName?: string;
}

const progressWidthMap: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-28',
  md: 'w-40',
  lg: 'w-48',
};

/**
 * FmLoadingIndicator
 *
 * Standard loading indicator with spinner + indeterminate progress bar.
 */
export function FmLoadingIndicator({
  message,
  size = 'md',
  showProgress = true,
  progressSize,
  className,
  messageClassName,
  progressClassName,
}: FmLoadingIndicatorProps) {
  const resolvedProgressSize = progressSize ?? size;

  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <FmGoldenGridLoader size={size} className="mb-[10px]" />
      {message && (
        <p className={cn('text-sm text-muted-foreground', messageClassName)}>
          {message}
        </p>
      )}
      {showProgress && (
        <div
          className={cn(
            'mt-[10px]',
            progressWidthMap[resolvedProgressSize],
            progressClassName
          )}
        >
          <FmLoadingProgressBar
            size={resolvedProgressSize}
            ariaLabel={message}
          />
        </div>
      )}
    </div>
  );
}
