import { cn } from '@/shared';

export interface FmLoadingProgressBarProps {
  /** Size variant for height */
  size?: 'sm' | 'md' | 'lg';
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
  /** Additional class names for outer wrapper */
  className?: string;
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-[5px]',
  md: 'h-[5px]',
  lg: 'h-[10px]',
};

/**
 * FmLoadingProgressBar
 *
 * Indeterminate progress bar used in loading states.
 * Keeps visuals consistent across page-level loaders.
 */
export function FmLoadingProgressBar({
  size = 'md',
  ariaLabel,
  className,
}: FmLoadingProgressBarProps) {
  const ariaProps = ariaLabel
    ? { role: 'progressbar', 'aria-label': ariaLabel }
    : { 'aria-hidden': true };

  return (
    <div className={cn('w-full', className)} {...ariaProps}>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-none border border-white/10 bg-white/10',
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            'absolute inset-y-0 w-[40%] bg-gradient-to-r from-transparent via-fm-gold to-transparent',
            'fm-loading-progress motion-reduce:animate-none'
          )}
        />
      </div>
    </div>
  );
}
