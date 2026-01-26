import { FmGoldenGridLoader } from './FmGoldenGridLoader';
import { FmLoadingProgressBar } from './FmLoadingProgressBar';
import { cn } from '@/shared';

export interface FmLoadingIndicatorProps {
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg';
  /** Show progress bar */
  showProgress?: boolean;
  /** Progress bar size */
  progressSize?: 'sm' | 'md' | 'lg';
  /** Optional class name for container */
  className?: string;
  /** Optional class name for progress wrapper */
  progressClassName?: string;
}

/**
 * FmLoadingIndicator
 *
 * Standard loading indicator with spinner + pulsing line.
 */
export function FmLoadingIndicator({
  size = 'md',
  showProgress = true,
  progressSize,
  className,
  progressClassName,
}: FmLoadingIndicatorProps) {
  const resolvedProgressSize = progressSize ?? size;

  return (
    <div
      className={cn('flex flex-col items-center gap-[20px] text-center', className)}
    >
      <FmGoldenGridLoader size={size} />
      {showProgress && (
        <FmLoadingProgressBar
          size={resolvedProgressSize}
          className={progressClassName}
        />
      )}
    </div>
  );
}
