import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/shared';
export function FmCommonLoadingSpinner({ size = 'md', className, }) {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-[3px]',
        lg: 'h-8 w-8 border-4',
    };
    return (_jsx("div", { className: cn('animate-spin rounded-full border-b-transparent border-fm-gold', sizeClasses[size], className) }));
}
