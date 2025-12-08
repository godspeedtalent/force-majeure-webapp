/**
 * FmCommonGridLayout
 *
 * Reusable grid layout component with responsive breakpoints
 * Standardizes grid layouts across the application
 */

import { cn } from '@/shared/utils/utils';

interface FmCommonGridLayoutProps {
  /** Grid items */
  children: React.ReactNode;
  /** Number of columns at different breakpoints */
  columns?: {
    default?: 1 | 2 | 3 | 4 | 5 | 6;
    sm?: 1 | 2 | 3 | 4 | 5 | 6;
    md?: 1 | 2 | 3 | 4 | 5 | 6;
    lg?: 1 | 2 | 3 | 4 | 5 | 6;
    xl?: 1 | 2 | 3 | 4 | 5 | 6;
  };
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

export const FmCommonGridLayout = ({
  children,
  columns = { default: 1, md: 2, lg: 3 },
  gap = 'md',
  className,
}: FmCommonGridLayoutProps) => {
  const gridClasses = cn(
    'grid',
    columns.default && columnClasses[columns.default],
    columns.sm && `sm:${columnClasses[columns.sm]}`,
    columns.md && `md:${columnClasses[columns.md]}`,
    columns.lg && `lg:${columnClasses[columns.lg]}`,
    columns.xl && `xl:${columnClasses[columns.xl]}`,
    gapClasses[gap],
    className
  );

  return <div className={gridClasses}>{children}</div>;
};
