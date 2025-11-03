import { FmBadge } from './FmBadge';
import { cn } from '@/shared/utils/utils';

export interface FmCommonBadgeItem {
  label: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

interface FmCommonBadgeGroupProps {
  badges: FmCommonBadgeItem[];
  maxDisplay?: number;
  className?: string;
  badgeClassName?: string;
  /** Gap between badges */
  gap?: 'sm' | 'md' | 'lg';
  /** Allow badges to wrap to multiple lines */
  wrap?: boolean;
}

const gapClasses = {
  sm: 'gap-1',
  md: 'gap-2',
  lg: 'gap-3',
};

/**
 * FmCommonBadgeGroup Component
 * 
 * A reusable component for displaying groups of FmBadge components.
 * Commonly used for artists, genres, tags, etc.
 * Supports limiting display count with "+X more" indicator.
 * 
 * Uses FmBadge components which can be primary (gold with black text) or 
 * secondary (transparent with white text/border).
 */
export function FmCommonBadgeGroup({
  badges,
  maxDisplay,
  className,
  badgeClassName,
  gap = 'md',
  wrap = true,
}: FmCommonBadgeGroupProps) {
  if (!badges || badges.length === 0) {
    return null;
  }

  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;
  const remainingCount = maxDisplay && badges.length > maxDisplay 
    ? badges.length - maxDisplay 
    : 0;

  return (
    <div
      className={cn(
        'flex items-center',
        gapClasses[gap],
        wrap && 'flex-wrap',
        className
      )}
    >
      {displayBadges.map((badge, index) => (
        <FmBadge
          key={index}
          label={badge.label}
          variant={badge.variant || 'secondary'}
          className={cn(badgeClassName, badge.className)}
        />
      ))}
      {remainingCount > 0 && (
        <FmBadge
          label={`+${remainingCount} more`}
          variant="secondary"
          className={cn('opacity-70', badgeClassName)}
        />
      )}
    </div>
  );
}
