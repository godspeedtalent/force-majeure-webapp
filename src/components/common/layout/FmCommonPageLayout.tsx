/**
 * FmCommonPageLayout
 * 
 * Standard page layout with title, subtitle, and content area
 * Provides consistent spacing and styling for full pages
 */

import { ReactNode } from 'react';
import { cn } from '@/shared/utils/utils';

interface FmCommonPageLayoutProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Page content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Header actions (buttons, etc) */
  actions?: ReactNode;
}

export const FmCommonPageLayout = ({
  title,
  subtitle,
  children,
  className,
  actions,
}: FmCommonPageLayoutProps) => {
  return (
    <div className={cn('container mx-auto px-4 py-8 max-w-7xl', className)}>
      {/* Page Header */}
      <div className='mb-8'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h1 className='text-3xl md:text-4xl font-canela text-foreground mb-2'>
              {title}
            </h1>
            {subtitle && (
              <p className='text-muted-foreground text-sm md:text-base'>
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className='flex items-center gap-2'>
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className='space-y-6'>
        {children}
      </div>
    </div>
  );
};
