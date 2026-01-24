/**
 * FmCommonLoadingState
 *
 * Standardized loading state component with spinner and optional message.
 * Can be centered in container or inline.
 */

import { cn } from '@/shared';
import { FmGoldenGridLoader } from '@/components/common/feedback/FmGoldenGridLoader';

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

const sizeMap: Record<'sm' | 'md' | 'lg', 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

export const FmCommonLoadingState = ({
  message,
  size = 'md',
  centered = true,
  className,
}: FmCommonLoadingStateProps) => {
  const content = (
    <div className={cn('text-center', className)}>
      <FmGoldenGridLoader size={sizeMap[size]} className="mx-auto mb-4" />
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
