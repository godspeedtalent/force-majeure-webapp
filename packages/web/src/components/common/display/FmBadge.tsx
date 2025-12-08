import { cn } from '@force-majeure/shared/utils/utils';

export interface FmBadgeProps {
  label: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

/**
 * FmBadge Component
 *
 * Styled badge component for Force Majeure brand
 * - Primary: Gold background with black text, transparent white on hover
 * - Secondary: Transparent background with white text/border, white fill on hover
 * - Both scale up slightly and glow gold on hover
 */
export function FmBadge({
  label,
  variant = 'secondary',
  className,
}: FmBadgeProps) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium transition-all duration-200 hover:scale-105';

  const variantStyles = {
    primary: cn(
      'bg-[hsl(var(--fm-gold))] text-black',
      'hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(207,173,118,0.6)]'
    ),
    secondary: cn(
      'bg-transparent text-white border border-white',
      'hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(207,173,118,0.6)]'
    ),
  };

  return (
    <span className={cn(baseStyles, variantStyles[variant], className)}>
      {label}
    </span>
  );
}
