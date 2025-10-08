import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '@/shared/utils/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon: Icon,
  title = 'No items found',
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div className={cn('text-center py-12', className)}>
      {Icon && (
        <Icon className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
      )}
      <h3 className='text-lg font-medium text-foreground mb-2'>{title}</h3>
      {description && (
        <p className='text-sm text-muted-foreground mb-4'>{description}</p>
      )}
      {action && <div className='mt-6'>{action}</div>}
    </div>
  );
};
