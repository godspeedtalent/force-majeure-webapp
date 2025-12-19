/**
 * FmCommonLoadingState
 *
 * Standardized loading state component with spinner and optional message.
 * Can be centered in container or inline.
 */

import { cn } from '@/shared';

interface FmCommonLoadingStateProps {
  /** Loading message */
  message?: string;
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg';
  /** Center in container */
  centered?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

export const FmCommonLoadingState = ({
  message,
  size = 'md',
  centered = true,
  className,
}: FmCommonLoadingStateProps) => {
  const content = (
    <div className={cn('text-center', className)}>
      <div
        className={cn(
          sizeMap[size],
          'animate-spin rounded-full border-fm-gold border-b-transparent mx-auto mb-4'
        )}
      />
      {message && <p className='text-sm text-muted-foreground'>{message}</p>}
    </div>
  );

  if (centered) {
    return (
      <div className='flex items-center justify-center min-h-[200px]'>
        {content}
      </div>
    );
  }

  return content;
};
