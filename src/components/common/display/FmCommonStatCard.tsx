/**
 * FmCommonStatCard
 *
 * Standardized stat/metric card for dashboards and admin pages
 * Displays a large value with label and optional icon/badge
 */

import { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/common/shadcn/badge';
import { Card, CardContent, CardHeader } from '@/components/common/shadcn/card';
import { cn } from '@/shared/utils/utils';

interface FmCommonStatCardProps {
  /** Main stat value */
  value: string | number;
  /** Label describing the stat */
  label: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Optional description/subtitle */
  description?: string;
  /** Optional badge */
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  };
  /** Trend indicator */
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  /** Card size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeConfig = {
  sm: {
    value: 'text-2xl',
    label: 'text-xs',
    padding: 'p-4',
  },
  md: {
    value: 'text-3xl',
    label: 'text-sm',
    padding: 'p-6',
  },
  lg: {
    value: 'text-4xl',
    label: 'text-base',
    padding: 'p-8',
  },
};

export const FmCommonStatCard = ({
  value,
  label,
  icon: Icon,
  description,
  badge,
  trend,
  size = 'md',
  className,
}: FmCommonStatCardProps) => {
  const config = sizeConfig[size];

  return (
    <Card
      className={cn(
        'border-border transition-all duration-300',
        'hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)]',
        'hover:scale-[1.02]',
        className
      )}
    >
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {Icon && (
              <Icon className='w-4 h-4 text-muted-foreground transition-colors duration-300 group-hover:text-fm-gold' />
            )}
            <p
              className={cn(config.label, 'text-muted-foreground font-medium')}
            >
              {label}
            </p>
          </div>
          {badge && (
            <Badge variant={badge.variant || 'secondary'}>{badge.label}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className={config.padding}>
        <div className='flex items-baseline gap-2'>
          <p className={cn(config.value, 'font-bold text-foreground')}>
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                'text-sm font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
        {description && (
          <p className='text-xs text-muted-foreground mt-1'>{description}</p>
        )}
      </CardContent>
    </Card>
  );
};
