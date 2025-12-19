import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Separator } from '@/components/common/shadcn/separator';
import { cn } from '@/shared';
export const FmCommonDetailSection = ({ title, description, icon: Icon, children, showSeparator = false, showSeparatorTop = false, className, contentClassName, actions, }) => {
    return (_jsxs("div", { className: cn('space-y-4', className), children: [showSeparatorTop && _jsx(Separator, {}), _jsxs("div", { className: 'flex items-start justify-between gap-4', children: [_jsxs("div", { className: 'space-y-1', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [Icon && _jsx(Icon, { className: 'w-5 h-5 text-accent' }), _jsx("h2", { className: 'text-xl font-canela tracking-wide text-foreground', children: title })] }), description && (_jsx("p", { className: 'text-sm text-muted-foreground max-w-2xl', children: description }))] }), actions && _jsx("div", { className: 'flex items-center gap-2', children: actions })] }), _jsx("div", { className: cn('space-y-4', contentClassName), children: children }), showSeparator && _jsx(Separator, { className: 'mt-6' })] }));
};
