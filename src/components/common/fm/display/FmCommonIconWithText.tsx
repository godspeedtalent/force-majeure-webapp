import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface FmCommonIconWithTextProps {
  icon: LucideIcon;
  text: string | React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const sizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const gapClasses = {
  sm: 'gap-1',
  md: 'gap-2',
  lg: 'gap-3',
};

/**
 * A reusable component for displaying an icon with text
 * Commonly used for event details, metadata, and inline information
 */
export function FmCommonIconWithText({
  icon: Icon,
  text,
  iconPosition = 'left',
  size = 'md',
  gap = 'md',
  className,
  iconClassName,
  textClassName,
}: FmCommonIconWithTextProps) {
  return (
    <div
      className={cn(
        'flex items-center',
        gapClasses[gap],
        sizeClasses[size],
        iconPosition === 'right' && 'flex-row-reverse',
        className
      )}
    >
      <Icon className={cn(iconSizeClasses[size], 'text-muted-foreground', iconClassName)} />
      <span className={cn('text-foreground', textClassName)}>{text}</span>
    </div>
  );
}
