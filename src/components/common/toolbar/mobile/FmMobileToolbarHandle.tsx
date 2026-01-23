import { useTranslation } from 'react-i18next';
import { Wrench } from 'lucide-react';
import { cn } from '@/shared';

interface FmMobileToolbarHandleProps {
  onClick: () => void;
  badgeCount?: number;
  className?: string;
}

/**
 * Persistent bottom handle bar for mobile toolbar
 * Replaces the FAB with a more discoverable swipe-up indicator
 * Shows a subtle tool icon and drag handle at the bottom of the screen
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
        // Fixed position at screen bottom
        'fixed bottom-0 left-0 right-0 z-[60]',
        // Height - compact with safe area
        'h-[48px]',
        // Styling - subtle frosted glass (very unobtrusive)
        'bg-black/40 backdrop-blur-sm',
        // Border - subtle top border
        'border-t border-white/10',
        // Sharp corners (design system)
        'rounded-none',
        // Layout - flex for icon and handle
        'flex items-center justify-center gap-[20px]',
        // Safe area padding
        'pb-[env(safe-area-inset-bottom)]',
        // Transitions
        'transition-all duration-200',
        // Active state - subtle feedback
        'active:bg-black/60',
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
      {/* Tool Icon - semi-transparent */}
      <div className="relative">
        <Wrench
          className="h-[18px] w-[18px] text-white/30"
          strokeWidth={1.5}
        />

        {/* Badge indicator - small dot */}
        {hasBadge && (
          <span
            className={cn(
              // Position - top-right of icon
              'absolute -top-[4px] -right-[4px]',
              // Size - small dot
              'h-[8px] w-[8px]',
              // Styling
              'bg-fm-danger',
              // Shape
              'rounded-full',
              // Border for contrast
              'border border-black/50'
            )}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Drag Handle - gold bar */}
      <div
        className={cn(
          'h-[4px] w-[80px]',
          'bg-fm-gold/40',
          'rounded-full'
        )}
        aria-hidden="true"
      />
    </button>
  );
}
