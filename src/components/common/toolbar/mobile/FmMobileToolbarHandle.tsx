import { useTranslation } from 'react-i18next';
import { Wrench } from 'lucide-react';
import { cn } from '@/shared';

interface FmMobileToolbarHandleProps {
  onClick: () => void;
  badgeCount?: number;
  className?: string;
}

/**
 * Side edge tab for mobile toolbar
 * Compact tab on right edge that stays above bottom navigation
 * Tap to open the dev tools drawer
 * Only visible on mobile (< 768px)
 */
export function FmMobileToolbarHandle({
  onClick,
  badgeCount = 0,
  className,
}: FmMobileToolbarHandleProps) {
  const { t } = useTranslation('common');
  const hasBadge = badgeCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        // Fixed position - right edge, above bottom nav
        'fixed right-0 bottom-[100px] z-[60]',
        // Dimensions - compact tab
        'w-[36px] h-[56px]',
        // Styling - frosted glass
        'bg-black/50 backdrop-blur-sm',
        // Border - left edge tab effect
        'border-l border-t border-b border-white/15',
        // Slight rounding on left edge only (tab peeking out)
        'rounded-l-[4px]',
        // Layout - vertical stack
        'flex flex-col items-center justify-center gap-[8px]',
        // Transitions
        'transition-all duration-200',
        // Active state
        'active:bg-black/70',
        // Visibility - mobile only
        'md:hidden',
        // Focus states
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-gold/50 focus-visible:ring-inset',
        className
      )}
      aria-label={
        hasBadge
          ? t('mobileDevTools.handle.openWithNotifications', { count: badgeCount })
          : t('mobileDevTools.handle.open')
      }
      type="button"
    >
      {/* Tool Icon */}
      <div className="relative">
        <Wrench
          className="h-[16px] w-[16px] text-white/40"
          strokeWidth={1.5}
        />

        {/* Badge indicator - small dot */}
        {hasBadge && (
          <span
            className={cn(
              // Position - top-right of icon
              'absolute -top-[3px] -right-[3px]',
              // Size - small dot
              'h-[8px] w-[8px]',
              // Styling
              'bg-fm-danger',
              // Shape
              'rounded-full',
              // Border for contrast
              'border border-black/50',
              // Subtle pulse animation
              'animate-pulse'
            )}
            aria-hidden="true"
          />
        )}
      </div>
    </button>
  );
}
