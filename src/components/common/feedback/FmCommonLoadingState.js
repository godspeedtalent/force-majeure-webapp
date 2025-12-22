import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * FmCommonLoadingState
 *
 * Standardized loading state component with spinner and optional message.
 * Can be centered in container or inline.
 */
import { cn } from '@/shared';
const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
};
export const FmCommonLoadingState = ({ message, size = 'md', centered = true, className, }) => {
    const content = (_jsxs("div", { className: cn('text-center', className), children: [_jsx("div", { className: cn(sizeMap[size], 'animate-spin rounded-full border-fm-gold border-b-transparent mx-auto mb-4') }), message && _jsx("p", { className: 'text-sm text-muted-foreground', children: message })] }));
    if (centered) {
        return (_jsx("div", { className: 'flex items-center justify-center min-h-[200px]', children: content }));
    }
    return content;
};
