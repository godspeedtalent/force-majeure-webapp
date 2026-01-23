import {
  ReactNode,
  useRef,
  useEffect,
  useCallback,
  useState,
  Children,
  cloneElement,
  isValidElement,
} from 'react';
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';

export interface MobileEventSwipeContainerProps {
  children: ReactNode;
  /** Callback when the active index changes */
  onIndexChange?: (index: number) => void;
  /** Callback with scroll progress (0-1) for parallax effects */
  onScrollProgress?: (progress: number) => void;
  /** Current active index (controlled) */
  currentIndex?: number;
  /** Additional className for the container */
  className?: string;
  /** Whether to enable scroll snap behavior */
  enabled?: boolean;
}

/**
 * Full-screen swipe container for mobile event browsing
 * Each child becomes a full-viewport snap section
 */
export function MobileEventSwipeContainer({
  children,
  onIndexChange,
  onScrollProgress,
  currentIndex,
  className,
  enabled = true,
}: MobileEventSwipeContainerProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrollingRef = useRef(false);
  const lastReportedIndexRef = useRef<number>(-1);
  const rafRef = useRef<number | null>(null);
  const [_scrollProgress, setScrollProgress] = useState(0);

  const childArray = Children.toArray(children);
  const totalItems = childArray.length;

  // Scroll to a specific index - uses container.scrollTo to avoid scrolling document
  const scrollToIndex = useCallback(
    (index: number) => {
      const section = sectionRefs.current[index];
      const container = containerRef.current;
      if (!section || !container) return;

      isScrollingRef.current = true;

      // Use container scrollTo instead of scrollIntoView to prevent document scroll
      const sectionTop = section.offsetTop;
      container.scrollTo({
        top: sectionTop,
        behavior: 'smooth',
      });

      // Reset scrolling flag after animation
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    },
    []
  );

  // Handle controlled scrolling when currentIndex changes
  useEffect(() => {
    if (currentIndex !== undefined && currentIndex !== lastReportedIndexRef.current) {
      scrollToIndex(currentIndex);
    }
  }, [currentIndex, scrollToIndex]);

  // Set up Intersection Observer to track active section
  useEffect(() => {
    if (!enabled || !isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        let maxRatio = 0;
        let activeIndex = -1;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const index = sectionRefs.current.findIndex(
              (ref) => ref === entry.target
            );
            if (index !== -1) {
              activeIndex = index;
            }
          }
        });

        // Only report if we found an active section and it's different
        if (
          activeIndex !== -1 &&
          activeIndex !== lastReportedIndexRef.current &&
          !isScrollingRef.current
        ) {
          lastReportedIndexRef.current = activeIndex;
          onIndexChange?.(activeIndex);

          // Haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(10);
          }
        }
      },
      {
        threshold: [0.5, 0.75],
        rootMargin: '-10% 0px -10% 0px',
      }
    );

    // Observe all sections
    sectionRefs.current.forEach((section) => {
      if (section) {
        observer.observe(section);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [enabled, isMobile, onIndexChange, totalItems]);

  // Track scroll progress for parallax effects
  useEffect(() => {
    if (!enabled || !isMobile || !onScrollProgress) return;

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = container.scrollTop;
        const sectionHeight = window.innerHeight;
        const currentSectionIndex = lastReportedIndexRef.current;

        if (currentSectionIndex < 0) return;

        // Calculate progress within current section (0-1)
        const sectionStart = currentSectionIndex * sectionHeight;
        const progressInSection = (scrollTop - sectionStart) / sectionHeight;

        // Clamp to 0-1 range
        const clampedProgress = Math.max(0, Math.min(1, progressInSection));

        setScrollProgress(clampedProgress);
        onScrollProgress(clampedProgress);
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [enabled, isMobile, onScrollProgress]);

  // Don't apply snap behavior on desktop
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        // Full screen container
        'h-[100dvh] w-full overflow-y-auto overflow-x-hidden',
        // Scroll snap behavior
        enabled && 'snap-y snap-mandatory',
        // Smooth scroll with spring-like feel
        'scroll-smooth',
        // Hide scrollbar
        'scrollbar-hide',
        className
      )}
      style={{
        // Account for mobile nav
        scrollPaddingTop: '0px',
        scrollPaddingBottom: '0px',
        // Overscroll behavior for better UX
        overscrollBehavior: 'contain',
        // Smooth momentum scrolling on iOS
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {childArray.map((child, index) => (
        <div
          key={index}
          ref={(el) => {
            sectionRefs.current[index] = el;
          }}
          className={cn(
            // Full viewport section
            'min-h-[100dvh] w-full',
            // Snap alignment
            'snap-start snap-always',
            // Flex container for content centering
            'flex flex-col',
            // Position relative for gradient overlays
            'relative',
            // Clip oversized children (prevents parallax images from hanging off screen edge)
            'overflow-hidden'
          )}
          data-swipe-index={index}
        >
          {isValidElement(child)
            ? cloneElement(child as React.ReactElement<{ sectionIndex?: number }>, {
                sectionIndex: index,
              })
            : child}

          {/* Bottom gradient overlay for smooth transition to next panel */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0',
              'h-[60px]',
              'bg-gradient-to-t from-black/80 via-black/40 to-transparent',
              'backdrop-blur-[2px]',
              'pointer-events-none',
              'z-20'
            )}
          />

          {/* Top gradient overlay for smooth transition from previous panel */}
          {index > 0 && (
            <div
              className={cn(
                'absolute top-0 left-0 right-0',
                'h-[60px]',
                'bg-gradient-to-b from-black/80 via-black/40 to-transparent',
                'backdrop-blur-[2px]',
                'pointer-events-none',
                'z-20'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
