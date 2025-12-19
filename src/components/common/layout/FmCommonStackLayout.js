import { jsx as _jsx } from "react/jsx-runtime";
/**
 * FmCommonStackLayout
 *
 * Reusable stack (vertical) layout component
 * Provides consistent spacing for stacked content
 */
import { cn } from '@/shared';
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
export const FmCommonStackLayout = ({ children, spacing = 'md', align = 'stretch', className, dividers = false, }) => {
    return (_jsx("div", { className: cn('flex flex-col', spacingClasses[spacing], alignClasses[align], dividers && 'divide-y divide-border', className), children: children }));
};
