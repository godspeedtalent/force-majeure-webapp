import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared';
const layoutClasses = {
    stack: 'space-y-4',
    'grid-2': 'grid grid-cols-1 md:grid-cols-2 gap-4',
    'grid-3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
};
export const FmCommonFormSection = ({ title, description, icon: Icon, children, layout = 'stack', className, required = false, }) => {
    return (_jsxs("div", { className: cn('space-y-4', className), children: [_jsxs("div", { className: 'space-y-1', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [Icon && _jsx(Icon, { className: 'w-4 h-4 text-muted-foreground' }), _jsxs("h3", { className: 'text-base font-semibold text-foreground', children: [title, required && _jsx("span", { className: 'text-destructive ml-1', children: "*" })] })] }), description && (_jsx("p", { className: 'text-sm text-muted-foreground', children: description }))] }), _jsx("div", { className: layoutClasses[layout], children: children })] }));
};
