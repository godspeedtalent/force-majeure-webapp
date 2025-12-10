import { useEffect, useState } from 'react';
import { cn } from '@force-majeure/shared';
import { useIsMobile } from '@force-majeure/shared';
import { SCROLL_THRESHOLDS } from '@force-majeure/shared';

export interface Section {
  id: string;
  label?: string;
}

export interface MobileSectionIndicatorProps {
  sections: Section[];
  activeSection: string | null;
  onSectionClick?: (sectionId: string) => void;
  className?: string;
}

/**
 * Mobile-only section indicator with dot navigation
 * Shows at bottom center of screen, only visible on mobile
 */
export const MobileSectionIndicator = ({
  sections,
  activeSection,
  onSectionClick,
  className,
}: MobileSectionIndicatorProps) => {
  const isMobile = useIsMobile();
  const [showPulse, setShowPulse] = useState(false);

  // Trigger pulse animation when active section changes
  useEffect(() => {
    if (activeSection) {
      setShowPulse(true);
      const timer = setTimeout(() => {
        setShowPulse(false);
      }, SCROLL_THRESHOLDS.SNAP_FEEDBACK_DURATION);
      return () => clearTimeout(timer);
    }
  }, [activeSection]);

  // Don't render on desktop
  if (!isMobile) return null;

  return (
    <div
      className={cn(
        'fixed bottom-[40px] left-1/2 -translate-x-1/2 z-40',
        'flex items-center gap-[10px]',
        'px-[20px] py-[10px]',
        'bg-black/70 backdrop-blur-md',
        'border border-white/20',
        'rounded-none',
        'md:hidden',
        className
      )}
    >
      {sections.map(section => {
        const isActive = section.id === activeSection;
        return (
          <button
            key={section.id}
            onClick={() => onSectionClick?.(section.id)}
            className={cn(
              'w-[10px] h-[10px]',
              'rounded-full',
              'transition-all duration-300',
              'border border-white/20',
              isActive
                ? 'bg-fm-gold scale-125'
                : 'bg-white/20 hover:bg-white/40',
              isActive && showPulse && 'animate-indicator-pulse'
            )}
            aria-label={section.label || `Go to section ${section.id}`}
          />
        );
      })}
    </div>
  );
};
