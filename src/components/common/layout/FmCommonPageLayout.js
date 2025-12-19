import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared';
export const FmCommonPageLayout = ({ title, subtitle, children, className, actions, }) => {
    return (_jsxs("div", { className: cn('container mx-auto px-4 py-8 max-w-7xl', className), children: [_jsx("div", { className: 'mb-8', children: _jsxs("div", { className: 'flex items-start justify-between gap-4', children: [_jsxs("div", { children: [_jsx("h1", { className: 'text-3xl md:text-4xl font-canela text-foreground mb-2', children: title }), subtitle && (_jsx("p", { className: 'text-muted-foreground text-sm md:text-base', children: subtitle }))] }), actions && _jsx("div", { className: 'flex items-center gap-2', children: actions })] }) }), _jsx("div", { className: 'space-y-6', children: children })] }));
};
