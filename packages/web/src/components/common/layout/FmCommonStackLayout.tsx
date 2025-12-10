/**
 * FmCommonStackLayout
 *
 * Reusable stack (vertical) layout component
 * Provides consistent spacing for stacked content
 */

import { cn } from '@force-majeure/shared';

interface FmCommonStackLayoutProps {
  /** Stack items */
  children: React.ReactNode;
  /** Spacing between items */
  spacing?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Alignment of items */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Additional CSS classes */
  className?: string;
  /** Add dividers between items */
  dividers?: boolean;
}

const spacingClasses = {
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
  xl: 'space-y-8',
  '2xl': 'space-y-12',
};

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

export const FmCommonStackLayout = ({
  children,
  spacing = 'md',
  align = 'stretch',
  className,
  dividers = false,
}: FmCommonStackLayoutProps) => {
  return (
    <div
      className={cn(
        'flex flex-col',
        spacingClasses[spacing],
        alignClasses[align],
        dividers && 'divide-y divide-border',
        className
      )}
    >
      {children}
    </div>
  );
};
