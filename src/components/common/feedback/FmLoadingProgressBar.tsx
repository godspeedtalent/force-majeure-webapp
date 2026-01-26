import { cn } from '@/shared';

export interface FmLoadingProgressBarProps {
  /** Size variant for width */
  size?: 'sm' | 'md' | 'lg';
  /** Optional aria-label for accessibility */
  ariaLabel?: string;
  /** Additional class names for outer wrapper */
  className?: string;
}

const widthClasses: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-16',
  md: 'w-24',
  lg: 'w-28',
};

/**
 * FmLoadingProgressBar
 *
 * Single pixel pulsing line used in loading states.
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
    <div className={cn('flex justify-center', className)} {...ariaProps}>
      <div
        className={cn(
          'h-px fm-loading-gradient relative overflow-hidden motion-reduce:animate-none',
          widthClasses[size]
        )}
      />
      <style>{`
        .fm-loading-gradient {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(223, 186, 125, 0.15) 15%,
            rgba(223, 186, 125, 0.3) 50%,
            rgba(223, 186, 125, 0.15) 85%,
            transparent 100%
          );
        }
        .fm-loading-gradient::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(223, 186, 125, 0.2) 20%,
            rgba(223, 186, 125, 0.8) 40%,
            rgba(223, 186, 125, 1) 50%,
            rgba(223, 186, 125, 0.8) 60%,
            rgba(223, 186, 125, 0.2) 80%,
            transparent 100%
          );
          animation: fm-gradient-sweep 2s ease-in-out infinite;
        }
        @keyframes fm-gradient-sweep {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .fm-loading-gradient::after {
            animation: none;
            left: 0;
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
