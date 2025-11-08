/**
 * FmCommonCard
 *
 * Versatile card component with two distinct styles:
 * - Default: Frosted glass effect with gradient background (classic FM style)
 * - Outline: Clean bordered style with minimal background
 *
 * Both variants include hover effects for enhanced UX.
 * Provides a foundation for InfoCard, StatCard, and other card-based components.
 */

import { ReactNode } from 'react';
import { cn } from '@/shared/utils/utils';

interface FmCommonCardProps {
  /** Card content */
  children: ReactNode;
  /** Card variant - default (frosted glass) or outline (clean border) */
  variant?: 'default' | 'outline';
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
      // Base frosted glass effect
      'rounded-none',
      'bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90',
      'backdrop-blur-sm',
      'border border-border/50',
      'shadow-xl',
      // Hover effects
      hoverable && 'transition-all duration-300',
      hoverable && 'hover:shadow-2xl',
      hoverable && 'hover:border-border',
      hoverable && 'hover:shadow-fm-gold/10',
      hoverable && isClickable && 'hover:scale-[1.01]'
    ),
    outline: cn(
      // Clean outline style
      'rounded-none',
      'bg-card',
      'border border-input',
      'shadow-sm',
      // Hover effects
      hoverable && 'transition-all duration-300',
      hoverable && 'hover:bg-white/5',
      hoverable && 'hover:border-fm-gold/50',
      hoverable && 'hover:shadow-[0_0_12px_rgba(212,175,55,0.15)]',
      hoverable && isClickable && 'hover:scale-[1.005]'
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
