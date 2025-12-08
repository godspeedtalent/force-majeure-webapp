import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@force-majeure/shared/utils/utils';
import { useIsMobile } from '@force-majeure/shared/hooks/use-mobile';
import { useScrollPosition } from '@force-majeure/shared/hooks/useScrollPosition';
import { SCROLL_THRESHOLDS } from '@force-majeure/shared/constants/scrollThresholds';

export interface MobileScrollCueProps {
  show?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
}

/**
 * Visual cue indicating more content below on mobile
 * Bouncing down arrow that auto-hides after delay or on scroll
 */
export const MobileScrollCue = ({
  show = true,
  autoHide = true,
  autoHideDelay = SCROLL_THRESHOLDS.SCROLL_CUE_DELAY,
  className,
}: MobileScrollCueProps) => {
  const isMobile = useIsMobile();
  const scrollY = useScrollPosition();
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (!autoHide || !show) return;

    // Auto-hide after delay
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, autoHideDelay);

    return () => clearTimeout(timer);
  }, [autoHide, autoHideDelay, show]);

  useEffect(() => {
    // Hide on scroll
    if (scrollY > 50) {
      setIsVisible(false);
    }
  }, [scrollY]);

  // Don't render on desktop or if not visible
  if (!isMobile || !isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-[100px] left-1/2 -translate-x-1/2 z-30',
        'flex flex-col items-center',
        'text-fm-gold',
        'animate-scroll-cue-bounce',
        'md:hidden',
        'pointer-events-none',
        className
      )}
    >
      <ChevronDown className='w-[40px] h-[40px]' strokeWidth={1.5} />
    </div>
  );
};
