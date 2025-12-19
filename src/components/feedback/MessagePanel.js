import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { cn } from '@/shared';
export const MessagePanel = ({ title, description, action, isLoading = false, className, }) => {
    if (isLoading) {
        return _jsx(FmCommonLoadingState, { centered: true });
    }
    return (_jsxs("div", { className: cn('bg-background/60 backdrop-blur-md border-2 border-border/40 p-12 text-center w-full shadow-2xl', 'animate-slide-up-fade', className), children: [_jsx("h1", { className: 'font-display text-5xl md:text-6xl mb-4', children: title }), description && (_jsx("p", { className: 'text-lg text-muted-foreground mb-8', children: description })), action && _jsx("div", { className: 'space-y-6', children: action })] }));
};
