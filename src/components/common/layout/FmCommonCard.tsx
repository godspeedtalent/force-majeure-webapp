/**
 * FmCommonCard
 *
 * Versatile card component with two distinct styles:
 * - Default: Semi-transparent with white border, gold border on hover
 * - Frosted: Glass effect background with blur (for modals, overlays)
 *
 * Both variants include hover effects for enhanced UX.
 * Provides a foundation for InfoCard, StatCard, and other card-based components.
 */

import { ReactNode } from 'react';
import { cn } from '@/shared';

interface FmCommonCardProps {
  /** Card content */
  children: ReactNode;
  /** Card variant - default (gold hover) or frosted (glass effect) */
  variant?: 'default' | 'frosted';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Enable hover effects (enabled by default) */
  hoverable?: boolean;
  /** Clickable card */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const sizeConfig = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const FmCommonCard = ({
  children,
  variant = 'default',
  size = 'md',
  hoverable = true,
  onClick,
  className,
}: FmCommonCardProps) => {
  const isClickable = !!onClick;

  const variantStyles = {
    default: cn(
      // Semi-transparent with white border, gold on hover
      'rounded-none',
      'bg-black/40',
      'border border-white/20',
      'shadow-sm',
      // Hover effects
      hoverable && 'transition-all duration-300',
      hoverable && 'hover:bg-black/35',
      hoverable && 'hover:border-fm-gold/50',
      hoverable && 'hover:shadow-[0_0_12px_rgba(223,186,125,0.15)]',
      hoverable && isClickable && 'hover:scale-[1.005]'
    ),
    frosted: cn(
      // Frosted glass effect
      'rounded-none',
      'bg-black/60',
      'backdrop-blur-sm',
      'border border-white/20',
      'shadow-xl',
      // Hover effects
      hoverable && 'transition-all duration-300',
      hoverable && 'hover:shadow-2xl',
      hoverable && 'hover:border-white/30',
      hoverable && 'hover:shadow-fm-gold/10',
      hoverable && isClickable && 'hover:scale-[1.01]'
    ),
  };

  return (
    <div
      className={cn(
        sizeConfig[size],
        variantStyles[variant],
        isClickable && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};
