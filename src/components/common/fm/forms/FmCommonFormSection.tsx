/**
 * FmCommonFormSection
 * 
 * Form-specific section component with consistent layout
 * Used within forms to group related fields with labels
 */

import { LucideIcon } from 'lucide-react';

import { cn } from '@/shared/utils/utils';

interface FmCommonFormSectionProps {
  /** Section title */
  title: string;
  /** Optional description/help text */
  description?: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Form fields */
  children: React.ReactNode;
  /** Layout for form fields */
  layout?: 'stack' | 'grid-2' | 'grid-3';
  /** Additional CSS classes */
  className?: string;
  /** Required indicator */
  required?: boolean;
}

const layoutClasses = {
  stack: 'space-y-4',
  'grid-2': 'grid grid-cols-1 md:grid-cols-2 gap-4',
  'grid-3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
};

export const FmCommonFormSection = ({
  title,
  description,
  icon: Icon,
  children,
  layout = 'stack',
  className,
  required = false,
}: FmCommonFormSectionProps) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Section Header */}
      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          {Icon && (
            <Icon className='w-4 h-4 text-muted-foreground' />
          )}
          <h3 className='text-base font-semibold text-foreground'>
            {title}
            {required && <span className='text-destructive ml-1'>*</span>}
          </h3>
        </div>
        {description && (
          <p className='text-sm text-muted-foreground'>
            {description}
          </p>
        )}
      </div>

      {/* Form Fields */}
      <div className={layoutClasses[layout]}>
        {children}
      </div>
    </div>
  );
};
