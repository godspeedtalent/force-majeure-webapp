import { Wrench } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

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
  const hasBadge = badgeCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base positioning - bottom-right with safe area support
        'fixed bottom-[80px] right-[16px] z-[60]',
        // Size - Material Design standard FAB
        'h-[56px] w-[56px]',
        // Styling - semi-transparent gold background with black text
        'bg-fm-gold/80 text-black backdrop-blur-sm',
        // Shape - full circle (exception to sharp corners)
        'rounded-full',
        // Shadow - gold glow
        'shadow-lg shadow-fm-gold/30',
        // Typography
        'font-canela',
        // Transitions and animations
        'transition-all duration-200',
        'hover:scale-110 active:scale-95',
        // Flex for icon centering
        'flex items-center justify-center',
        // Visibility - mobile only
        'block md:hidden',
        // Focus states
        'focus:outline-none focus:ring-2 focus:ring-fm-gold/50 focus:ring-offset-2 focus:ring-offset-black',
        className
      )}
      aria-label={`Open developer tools${hasBadge ? ` (${badgeCount} notifications)` : ''}`}
      type="button"
    >
      {/* Wrench Icon */}
      <Wrench className="h-[26px] w-[26px]" strokeWidth={2.5} />

      {/* Notification Badge */}
      {hasBadge && (
        <span
          className={cn(
            // Position - top-right of FAB
            'absolute -top-[4px] -right-[4px]',
            // Size - minimum 20px for readability
            'min-w-[20px] h-[20px]',
            // Styling - red background with white text
            'bg-fm-danger text-white',
            // Shape - circle for single digit, pill for multiple
            'rounded-full',
            // Typography - small and bold
            'text-[10px] font-bold',
            // Layout - center content
            'flex items-center justify-center',
            // Padding for multi-digit numbers
            'px-[5px]',
            // Border for contrast
            'border-2 border-black',
            // Shadow
            'shadow-sm'
          )}
          aria-label={`${badgeCount} notifications`}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </button>
  );
}
