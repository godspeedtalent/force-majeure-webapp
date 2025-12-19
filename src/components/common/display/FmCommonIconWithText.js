import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared';
const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
};
const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
};
const gapClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
};
/**
 * FmCommonIconWithText Component
 *
 * A reusable component for displaying an icon with text.
 * Commonly used for event details, metadata, and inline information.
 *
 * Features:
 * - Flexible icon positioning (left/right)
 * - Multiple size options (sm/md/lg)
 * - Hover effects: icon and text turn gold
 */
export function FmCommonIconWithText({ icon: Icon, text, iconPosition = 'left', size = 'md', gap = 'md', className, iconClassName, textClassName, }) {
    return (_jsxs("div", { className: cn('flex items-center', 'transition-all duration-200 rounded-md px-2 py-1.5 -mx-2', 'group cursor-default', gapClasses[gap], sizeClasses[size], iconPosition === 'right' && 'flex-row-reverse', className), children: [_jsx(Icon, { className: cn(iconSizeClasses[size], 'text-muted-foreground transition-colors duration-200', 'group-hover:text-[hsl(var(--fm-gold))]', iconClassName) }), _jsx("span", { className: cn('text-foreground transition-colors duration-200', 'group-hover:text-[hsl(var(--fm-gold))]', textClassName), children: text })] }));
}
