import { Badge } from '@/components/ui/shadcn/badge';
import { cn } from '@/shared/utils/utils';

export interface FmCommonBadgeItem {
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
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
 * A reusable component for displaying groups of badges
 * Commonly used for artists, genres, tags, etc.
 * Supports limiting display count with "+X more" indicator
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
        <Badge
          key={index}
          variant={badge.variant || 'outline'}
          className={cn(badgeClassName, badge.className)}
        >
          {badge.label}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className={cn('text-muted-foreground', badgeClassName)}>
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}
