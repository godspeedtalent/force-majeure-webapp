/**
 * FmCommonPageHeader
 *
 * Standardized page header component
 * Provides consistent layout for page title, description, actions, and optional stats
 */

import { LucideIcon } from 'lucide-react';

import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { cn } from '@/shared/utils/utils';

interface FmCommonPageHeaderProps {
  /** Page title */
  title: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Optional description/subtitle */
  description?: string;
  /** Action buttons or elements */
  actions?: React.ReactNode;
  /** Stat cards or other content to display below title */
  stats?: React.ReactNode;
  /** Show decorative divider */
  showDivider?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const FmCommonPageHeader = ({
  title,
  icon: Icon,
  description,
  actions,
  stats,
  showDivider = true,
  className,
}: FmCommonPageHeaderProps) => {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Title Row */}
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-2'>
          <div className='flex items-center gap-3'>
            {Icon && (
              <div className='flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10'>
                <Icon className='w-5 h-5 text-accent' />
              </div>
            )}
            <h1 className='text-3xl lg:text-4xl font-canela tracking-wide text-foreground'>
              {title}
            </h1>
          </div>
          {description && (
            <p className='text-muted-foreground text-sm max-w-2xl'>
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions && <div className='flex items-center gap-2'>{actions}</div>}
      </div>

      {/* Stats Section */}
      {stats && (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>{stats}</div>
      )}

      {/* Divider */}
      {showDivider && <DecorativeDivider />}
    </div>
  );
};
