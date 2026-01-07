import { ReactNode } from 'react';
import { FmCommonLoadingSpinner } from './FmCommonLoadingSpinner';
import { cn } from '@/shared';

export interface FmLoadingContainerProps {
  /** Whether the content is loading */
  isLoading: boolean;
  /** Content to display when not loading */
  children: ReactNode;
  /** Size of the loading spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Minimum height for the loading state container */
  minHeight?: string;
  /** Additional class names for the container */
  className?: string;
  /** Whether to show a subtle background during loading */
  showBackground?: boolean;
}

/**
 * A wrapper component that shows a loading spinner when isLoading is true,
 * and shows the children when loading is complete.
 *
 * This standardizes the loading pattern used across 163+ files in the codebase.
 *
 * @example
 * ```tsx
 * <FmLoadingContainer isLoading={isLoading}>
 *   <div>Your content here</div>
 * </FmLoadingContainer>
 * ```
 */
export const FmLoadingContainer = ({
  isLoading,
  children,
  size = 'md',
  minHeight = '200px',
  className,
  showBackground = false,
}: FmLoadingContainerProps) => {
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          showBackground && 'bg-black/20 backdrop-blur-sm rounded-none',
          className
        )}
        style={{ minHeight }}
      >
        <FmCommonLoadingSpinner size={size} />
      </div>
    );
  }

  return <>{children}</>;
};

FmLoadingContainer.displayName = 'FmLoadingContainer';
