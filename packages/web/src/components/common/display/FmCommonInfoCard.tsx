/**
 * FmCommonInfoCard
 *
 * Standardized info card for displaying metadata with icon.
 * Uses FmCommonCard for base styling and FmCommonIconWithText for icon display.
 * Used for event details, venue info, and other key-value displays.
 */

import { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/common/shadcn/card';
import { cn } from '@force-majeure/shared/utils/utils';

interface FmCommonInfoCardProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Label/title */
  label: string;
  /** Value/description */
  value: string | React.ReactNode;
  /** Card size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Layout direction */
  layout?: 'horizontal' | 'vertical';
  /** Additional CSS classes */
  className?: string;
  /** Icon color class */
  iconClassName?: string;
}

const sizeConfig = {
  sm: {
    container: 'p-3',
    icon: 'w-4 h-4',
    label: 'text-xs',
    value: 'text-sm',
  },
  md: {
    container: 'p-4',
    icon: 'w-5 h-5',
    label: 'text-sm',
    value: 'text-base',
  },
  lg: {
    container: 'p-6',
    icon: 'w-6 h-6',
    label: 'text-base',
    value: 'text-lg',
  },
};

export const FmCommonInfoCard = ({
  icon: Icon,
  label,
  value,
  size = 'md',
  layout = 'horizontal',
  className,
  iconClassName,
}: FmCommonInfoCardProps) => {
  const config = sizeConfig[size];

  return (
    <Card
      className={cn(
        'border-border',
        'transition-all duration-300',
        'hover:bg-white/5',
        'hover:border-fm-gold/50',
        'hover:shadow-[0_0_12px_rgba(212,175,55,0.15)]',
        className
      )}
    >
      <CardContent
        className={cn(
          'flex gap-3',
          config.container,
          layout === 'vertical' ? 'flex-col items-start' : 'items-center'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-md bg-accent/10 p-2',
            layout === 'vertical' && 'w-full'
          )}
        >
          <Icon className={cn(config.icon, 'text-accent', iconClassName)} />
        </div>
        <div className='flex-1 min-w-0'>
          <p className={cn(config.label, 'text-muted-foreground font-medium')}>
            {label}
          </p>
          <div className={cn(config.value, 'text-foreground font-normal')}>
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
