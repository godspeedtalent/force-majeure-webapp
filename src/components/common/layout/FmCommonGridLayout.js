import { jsx as _jsx } from "react/jsx-runtime";
/**
 * FmCommonGridLayout
 *
 * Reusable grid layout component with responsive breakpoints
 * Standardizes grid layouts across the application
 */
import { cn } from '@/shared';
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
export const FmCommonGridLayout = ({ children, columns = { default: 1, md: 2, lg: 3 }, gap = 'md', className, }) => {
    const gridClasses = cn('grid', columns.default && columnClasses[columns.default], columns.sm && `sm:${columnClasses[columns.sm]}`, columns.md && `md:${columnClasses[columns.md]}`, columns.lg && `lg:${columnClasses[columns.lg]}`, columns.xl && `xl:${columnClasses[columns.xl]}`, gapClasses[gap], className);
    return _jsx("div", { className: gridClasses, children: children });
};
