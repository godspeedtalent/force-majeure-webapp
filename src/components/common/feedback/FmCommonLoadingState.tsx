/**
 * FmCommonLoadingState
 *
 * Standardized loading state component with spinner and optional message.
 * Can be centered in container or inline.
 */

import { cn } from '@/shared';
import { FmLoadingIndicator } from '@/components/common/feedback/FmLoadingIndicator';

interface FmCommonLoadingStateProps {
  /** Loading message */
  message?: string;
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg';
  /** Show progress bar */
  showProgress?: boolean;
  /** Progress bar size */
  progressSize?: 'sm' | 'md' | 'lg';
  /** Optional class name for progress wrapper */
  progressClassName?: string;
  /** Center in container */
  centered?: boolean;
  /** Expand to full viewport height (use when loader is the only content) */
  fullScreen?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const FmCommonLoadingState = ({
  message,
  size = 'md',
  showProgress = true,
  progressSize,
  progressClassName,
  centered = true,
  fullScreen = false,
  className,
}: FmCommonLoadingStateProps) => {
  const content = (
    <FmLoadingIndicator
      message={message}
      size={size}
      showProgress={showProgress}
      progressSize={progressSize}
      className={className}
      progressClassName={progressClassName}
    />
  );

  if (centered) {
    return (
      <div
        className={cn(
          'flex items-center justify-center w-full h-full',
          fullScreen && 'min-h-[100dvh]'
        )}
      >
        {content}
      </div>
    );
  }

  return content;
};
