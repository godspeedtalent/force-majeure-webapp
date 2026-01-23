import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench } from 'lucide-react';
import { cn } from '@/shared';

interface FmMobileDevBarProps {
  onClick: () => void;
  badgeCount?: number;
  className?: string;
}

/**
 * Sticky bottom bar for mobile developer toolbar
 *
 * - Stays fixed at the bottom of the viewport
 * - Automatically positions above the footer when scrolled to the bottom
 * - Full-width bar with centered wrench icon and badge
 */
export function FmMobileDevBar({
  onClick,
  badgeCount = 0,
  className,
}: FmMobileDevBarProps) {
  const { t } = useTranslation('common');
  const hasBadge = badgeCount > 0;
  const [bottomOffset, setBottomOffset] = useState(0);

  const updatePosition = useCallback(() => {
    const footer = document.querySelector('footer');
    if (!footer) {
      setBottomOffset(0);
      return;
    }

    const footerRect = footer.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // If footer is visible in the viewport, offset the bar above it
    if (footerRect.top < viewportHeight) {
      const visibleFooterHeight = viewportHeight - footerRect.top;
      setBottomOffset(Math.max(0, visibleFooterHeight));
    } else {
      setBottomOffset(0);
    }
  }, []);

  useEffect(() => {
    // Initial calculation
    updatePosition();

    // Update on scroll and resize
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition]);

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base positioning - fixed bottom with dynamic offset
        'fixed left-0 right-0 z-[60]',
        // Height - consistent bar height
        'h-12',
        // Styling - matches design system (frosted glass)
        'bg-black/70 backdrop-blur-md',
        'hover:bg-black/80',
        // Border - top border for separation
        'border-t border-white/20',
        // Shadow
        'shadow-lg shadow-black/30',
        // Typography
        'font-canela',
        // Transitions
        'transition-all duration-200',
        // Flex for content centering
        'flex items-center justify-center gap-[10px]',
        // Visibility - mobile only
        'md:hidden',
        // Focus states
        'focus:outline-none focus:ring-2 focus:ring-fm-gold/50 focus:ring-inset',
        className
      )}
      style={{ bottom: bottomOffset }}
      aria-label={hasBadge ? t('mobileDevTools.fab.openWithNotifications', { count: badgeCount }) : t('mobileDevTools.fab.open')}
      type="button"
    >
      {/* Wrench Icon */}
      <Wrench className="h-5 w-5 text-muted-foreground" strokeWidth={2} />

      {/* Label */}
      <span className="text-sm text-muted-foreground uppercase tracking-wider">
        {t('mobileDevTools.fab.label', 'Dev Tools')}
      </span>

      {/* Notification Badge */}
      {hasBadge && (
        <span
          className={cn(
            // Size - minimum for readability
            'min-w-[20px] h-[20px]',
            // Styling - gold background with black text
            'bg-fm-gold text-black',
            // Shape - pill
            'rounded-full',
            // Typography - small and bold
            'text-[10px] font-bold',
            // Layout - center content
            'flex items-center justify-center',
            // Padding for multi-digit numbers
            'px-[6px]'
          )}
          aria-label={t('mobileDevTools.fab.notifications', { count: badgeCount })}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </button>
  );
}
