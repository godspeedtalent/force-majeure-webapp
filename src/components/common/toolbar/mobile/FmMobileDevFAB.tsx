import { useTranslation } from 'react-i18next';
import { Wrench } from 'lucide-react';
import { cn } from '@/shared';

interface FmMobileDevFABProps {
  onClick: () => void;
  badgeCount?: number;
  className?: string;
}

/**
 * Floating Action Button (FAB) for mobile developer toolbar
 * Positioned in bottom-right corner with wrench icon and optional badge
 * Only visible on mobile (< 768px)
 */
export function FmMobileDevFAB({
  onClick,
  badgeCount = 0,
  className,
}: FmMobileDevFABProps) {
  const { t } = useTranslation('common');
  const hasBadge = badgeCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base positioning - bottom-right with safe area support
        'fixed bottom-[80px] right-[16px] z-[60]',
        // Size - icon button standard
        'h-10 w-10',
        // Styling - matches icon button pattern (bg-white/5 with hover states)
        'bg-white/10 text-muted-foreground backdrop-blur-sm',
        'hover:bg-white/20 hover:text-foreground',
        // Shape - sharp corners (design system standard)
        'rounded-none',
        // Border - subtle outline
        'border border-white/20',
        // Shadow
        'shadow-lg shadow-black/30',
        // Typography
        'font-canela',
        // Transitions and animations
        'transition-all duration-200',
        'hover:scale-105 active:scale-95',
        // Flex for icon centering
        'flex items-center justify-center',
        // Visibility - mobile only (flex on mobile, hidden on md+)
        'md:hidden',
        // Focus states
        'focus:outline-none focus:ring-2 focus:ring-fm-gold/50 focus:ring-offset-2 focus:ring-offset-black',
        className
      )}
      aria-label={hasBadge ? t('mobileDevTools.fab.openWithNotifications', { count: badgeCount }) : t('mobileDevTools.fab.open')}
      type="button"
    >
      {/* Wrench Icon */}
      <Wrench className="h-5 w-5" strokeWidth={2} />

      {/* Notification Badge */}
      {hasBadge && (
        <span
          className={cn(
            // Position - top-right of button
            'absolute -top-[6px] -right-[6px]',
            // Size - minimum for readability
            'min-w-[16px] h-[16px]',
            // Styling - red background with white text
            'bg-fm-danger text-white',
            // Shape - circle for single digit, pill for multiple
            'rounded-full',
            // Typography - small and bold
            'text-[9px] font-bold',
            // Layout - center content
            'flex items-center justify-center',
            // Padding for multi-digit numbers
            'px-1',
            // Border for contrast
            'border border-black',
            // Shadow
            'shadow-sm'
          )}
          aria-label={t('mobileDevTools.fab.notifications', { count: badgeCount })}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </button>
  );
}
