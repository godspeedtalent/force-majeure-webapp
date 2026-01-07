import { cn } from '@/shared';
import { useIsMobile } from '@/shared';

export interface MobileAutoScrollProgressProps {
  /** Progress from 0 to 1 */
  progress: number;
  /** Whether auto-scroll is active */
  isActive: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Thin gold progress bar showing auto-scroll countdown
 * Positioned at the very bottom of the viewport
 */
export function MobileAutoScrollProgress({
  progress,
  isActive,
  className,
}: MobileAutoScrollProgressProps) {
  const isMobile = useIsMobile();

  // Only render on mobile when active
  if (!isMobile || !isActive) return null;

  return (
    <div
      className={cn(
        // Fixed position at very bottom of viewport
        'fixed bottom-0 left-0 right-0 z-50',
        // Track styling
        'h-[3px] bg-white/10',
        // Transition for show/hide
        'transition-opacity duration-300',
        isActive ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {/* Progress fill */}
      <div
        className='h-full bg-fm-gold'
        style={{
          width: `${progress * 100}%`,
          boxShadow: '0 0 10px rgba(223, 186, 125, 0.6)',
          transition: 'none',
        }}
      />
    </div>
  );
}
