import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

import { FmCommonEmptyState } from './display/FmCommonEmptyState';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * EmptyState
 * 
 * @deprecated Use FmCommonEmptyState instead
 */
export const EmptyState = ({
  icon,
  title = 'No items found',
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <FmCommonEmptyState
      icon={icon}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
};
