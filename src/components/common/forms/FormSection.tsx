/**
 * FormSection
 *
 * Simple section component with decorative dividers for visual separation.
 * Used to divide form content into distinct visual areas.
 *
 * **When to use:**
 * - When you need visual separation with decorative dividers
 * - For long forms that need clear section breaks
 * - Supports forwardRef for scroll-to-section behavior
 *
 * **See also:**
 * - `FmCommonFormSection` - For structured layout with grids, icons, and required indicators
 */

import * as React from 'react';

import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { cn } from '@/shared';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  showTopDivider?: boolean;
  showBottomDivider?: boolean;
}

export const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  (
    {
      title,
      children,
      className,
      showTopDivider = false,
      showBottomDivider = true,
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('mt-8 mb-6', className)}>
        {showTopDivider && (
          <DecorativeDivider
            marginTop='mt-0'
            marginBottom='mb-8'
            opacity={0.4}
            lineWidth='w-16'
          />
        )}
        <div className='space-y-4'>
          <h3 className='font-canela text-base text-foreground'>{title}</h3>
          {children}
        </div>
        {showBottomDivider && (
          <DecorativeDivider
            marginTop='mt-6'
            marginBottom='mb-0'
            opacity={0.4}
            lineWidth='w-16'
          />
        )}
      </div>
    );
  }
);

FormSection.displayName = 'FormSection';
