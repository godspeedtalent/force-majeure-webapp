import { useEffect, useState } from 'react';
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';
import { SCROLL_THRESHOLDS } from '@/shared';

export interface MobileSwipeIndicatorProps {
  /** Total number of items (including title card) */
  totalCount: number;
  /** Current active index (0-based) */
  currentIndex: number;
  /** Number of upcoming events (not including title card) */
  upcomingCount: number;
  /** Callback when user taps a dot to navigate */
  onIndexClick?: (index: number) => void;
  /** Additional className */
  className?: string;
  /** Maximum dots to show before collapsing */
  maxDots?: number;
}

/**
 * Mobile swipe indicator with dynamic pagination dots
 * Shows title card + upcoming events + past events with visual separation
 * Collapses to show subset when too many items
 */
export function MobileSwipeIndicator({
  totalCount,
  currentIndex,
  upcomingCount,
  onIndexClick,
  className,
  maxDots = 9,
}: MobileSwipeIndicatorProps) {
  const isMobile = useIsMobile();
  const [showPulse, setShowPulse] = useState(false);

  // Calculate indices
  const titleIndex = 0;
  const lastUpcomingIndex = upcomingCount; // 0-based: upcomingCount is the last upcoming
  const hasPastEvents = totalCount > upcomingCount + 1;

  // Trigger pulse animation when index changes
  useEffect(() => {
    setShowPulse(true);
    const timer = setTimeout(() => {
      setShowPulse(false);
    }, SCROLL_THRESHOLDS.SNAP_FEEDBACK_DURATION);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Don't render on desktop
  if (!isMobile) return null;

  // Determine which dots to show
  const shouldCollapse = totalCount > maxDots;

  // Calculate visible range for collapsed view
  const getVisibleRange = (): number[] => {
    if (!shouldCollapse) {
      return Array.from({ length: totalCount }, (_, i) => i);
    }

    // Always show first dot (title), current, and a window around current
    const windowSize = 2; // dots on each side of current
    const indices = new Set<number>();

    // Always show title
    indices.add(0);

    // Show window around current
    for (let i = currentIndex - windowSize; i <= currentIndex + windowSize; i++) {
      if (i >= 0 && i < totalCount) {
        indices.add(i);
      }
    }

    // Always show last dot
    indices.add(totalCount - 1);

    return Array.from(indices).sort((a, b) => a - b);
  };

  const visibleIndices = getVisibleRange();

  // Check if there's a gap before an index
  const hasGapBefore = (index: number, visibleIndex: number): boolean => {
    if (visibleIndex === 0) return false;
    const prevVisible = visibleIndices[visibleIndex - 1];
    return index - prevVisible > 1;
  };

  // Check if this is the separator between upcoming and past
  const isSeparatorPosition = (index: number): boolean => {
    return hasPastEvents && index === lastUpcomingIndex;
  };

  // Determine dot type for styling
  const getDotType = (index: number): 'title' | 'upcoming' | 'past' => {
    if (index === titleIndex) return 'title';
    if (index <= lastUpcomingIndex) return 'upcoming';
    return 'past';
  };

  return (
    <div
      className={cn(
        'fixed bottom-[90px] left-1/2 -translate-x-1/2 z-40',
        'flex items-center gap-[6px]',
        'px-[16px] py-[10px]',
        'bg-black/70 backdrop-blur-md',
        'border border-white/20',
        'rounded-none',
        'md:hidden',
        className
      )}
    >
      {visibleIndices.map((index, visibleIdx) => {
        const isActive = index === currentIndex;
        const dotType = getDotType(index);
        const showSeparator = isSeparatorPosition(index);
        const showGap = hasGapBefore(index, visibleIdx);

        return (
          <div key={index} className='flex items-center gap-[6px]'>
            {/* Gap indicator (ellipsis) */}
            {showGap && (
              <span className='text-white/40 text-xs px-1'>•••</span>
            )}

            {/* The dot */}
            <button
              onClick={() => onIndexClick?.(index)}
              className={cn(
                'transition-all duration-300',
                'border',
                // Size - title dot is slightly different
                dotType === 'title' ? 'w-[12px] h-[12px]' : 'w-[8px] h-[8px]',
                // Shape - title is square, others are round
                dotType === 'title' ? 'rounded-sm' : 'rounded-full',
                // Active state
                isActive
                  ? 'bg-fm-gold border-fm-gold scale-125'
                  : dotType === 'past'
                    ? 'bg-white/10 border-white/10 hover:bg-white/20'
                    : 'bg-white/20 border-white/20 hover:bg-white/40',
                // Pulse animation
                isActive && showPulse && 'animate-indicator-pulse'
              )}
              aria-label={
                dotType === 'title'
                  ? 'Go to welcome screen'
                  : dotType === 'upcoming'
                    ? `Go to upcoming event ${index}`
                    : `Go to past event ${index - upcomingCount}`
              }
            />

            {/* Visual separator between upcoming and past */}
            {showSeparator && hasPastEvents && (
              <div className='w-px h-[12px] bg-white/20 mx-[2px]' />
            )}
          </div>
        );
      })}
    </div>
  );
}
