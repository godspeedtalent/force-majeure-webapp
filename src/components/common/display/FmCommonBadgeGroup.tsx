import { useState } from 'react';
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
  /** Number of additional badges to show on each expansion (default: 5) */
  pageSize?: number;
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
 * Supports limiting display count with expandable "+X more" indicator.
 *
 * Composed of: FmBadge components
 */
export function FmCommonBadgeGroup({
  badges,
  maxDisplay,
  className,
  badgeClassName,
  gap = 'md',
  wrap = true,
  pageSize = 5,
}: FmCommonBadgeGroupProps) {
  const [currentDisplay, setCurrentDisplay] = useState(maxDisplay);

  if (!badges || badges.length === 0) {
    return null;
  }

  const displayCount = currentDisplay || badges.length;
  const displayBadges = badges.slice(0, displayCount);
  const remainingCount =
    badges.length > displayCount ? badges.length - displayCount : 0;

  const handleExpand = () => {
    if (currentDisplay) {
      setCurrentDisplay(Math.min(currentDisplay + pageSize, badges.length));
    }
  };

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
        <button onClick={handleExpand} className='inline-flex'>
          <FmBadge
            label={`+${remainingCount} more`}
            variant='secondary'
            className={cn('opacity-70 cursor-pointer', badgeClassName)}
          />
        </button>
      )}
    </div>
  );
}
