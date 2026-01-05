/**
 * FmCommonEmptyState
 *
 * Standardized empty state component for displaying when no data is available.
 * Provides consistent messaging with optional icon, description, and call-to-action.
 */

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared';

interface FmCommonEmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Main title/heading */
  title?: string;
  /** Description text */
  description?: string;
  /** Call-to-action button or element */
  action?: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Custom icon class names (e.g., for color) */
  iconClassName?: string;
}

const sizeConfig = {
  sm: {
    container: 'py-6',
    icon: 'w-8 h-8',
    title: 'text-base',
    description: 'text-xs',
  },
  md: {
    container: 'py-12',
    icon: 'w-12 h-12',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    icon: 'w-16 h-16',
    title: 'text-xl',
    description: 'text-base',
  },
};

export const FmCommonEmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  size = 'md',
  className,
  iconClassName,
}: FmCommonEmptyStateProps) => {
  const { t } = useTranslation('common');
  const config = sizeConfig[size];
  const displayTitle = title || t('empty.noItemsFound');

  return (
    <div className={cn('text-center', config.container, className)}>
      {Icon && (
        <Icon
          className={cn(config.icon, 'mx-auto mb-4', iconClassName || 'text-muted-foreground')}
        />
      )}
      <h3 className={cn(config.title, 'text-foreground mb-2')}>
        {displayTitle}
      </h3>
      {description && (
        <p className={cn(config.description, 'text-muted-foreground mb-4')}>
          {description}
        </p>
      )}
      {action && <div className='mt-6'>{action}</div>}
    </div>
  );
};
