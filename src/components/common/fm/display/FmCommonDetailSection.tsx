/**
 * FmCommonDetailSection
 * 
 * Standardized section component for content areas.
 * Provides consistent title, description, and content layout.
 * 
 * Commonly used with FmCommonIconWithText components in its children
 * for displaying structured detail lists.
 */

import { LucideIcon } from 'lucide-react';

import { Separator } from '@/components/ui/shadcn/separator';
import { cn } from '@/shared/utils/utils';

interface FmCommonDetailSectionProps {
  /** Section title */
  title: string;
  /** Optional description/subtitle */
  description?: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Section content */
  children: React.ReactNode;
  /** Show separator after section */
  showSeparator?: boolean;
  /** Show separator before section */
  showSeparatorTop?: boolean;
  /** Additional CSS classes for container */
  className?: string;
  /** Additional CSS classes for content area */
  contentClassName?: string;
  /** Header actions (buttons, etc.) */
  actions?: React.ReactNode;
}

export const FmCommonDetailSection = ({
  title,
  description,
  icon: Icon,
  children,
  showSeparator = false,
  showSeparatorTop = false,
  className,
  contentClassName,
  actions,
}: FmCommonDetailSectionProps) => {
  return (
    <div className={cn('space-y-4', className)}>
      {showSeparatorTop && <Separator />}
      
      {/* Section Header */}
      <div className='flex items-start justify-between gap-4'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            {Icon && (
              <Icon className='w-5 h-5 text-accent' />
            )}
            <h2 className='text-xl font-canela tracking-wide text-foreground'>
              {title}
            </h2>
          </div>
          {description && (
            <p className='text-sm text-muted-foreground max-w-2xl'>
              {description}
            </p>
          )}
        </div>

        {/* Header Actions */}
        {actions && (
          <div className='flex items-center gap-2'>
            {actions}
          </div>
        )}
      </div>

      {/* Section Content */}
      <div className={cn('space-y-4', contentClassName)}>
        {children}
      </div>

      {showSeparator && <Separator className='mt-6' />}
    </div>
  );
};
