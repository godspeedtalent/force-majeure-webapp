import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared';
const sizeConfig = {
    sm: {
        container: 'py-6',
        icon: 'w-8 h-8',
        title: 'text-base',
        description: 'text-xs',
    },
    md: {
        container: 'py-12',
        icon: 'w-12 h-12',
        title: 'text-lg',
        description: 'text-sm',
    },
    lg: {
        container: 'py-16',
        icon: 'w-16 h-16',
        title: 'text-xl',
        description: 'text-base',
    },
};
export const FmCommonEmptyState = ({ icon: Icon, title = 'No items found', description, action, size = 'md', className, }) => {
    const config = sizeConfig[size];
    return (_jsxs("div", { className: cn('text-center', config.container, className), children: [Icon && (_jsx(Icon, { className: cn(config.icon, 'text-muted-foreground mx-auto mb-4') })), _jsx("h3", { className: cn(config.title, 'font-medium text-foreground mb-2'), children: title }), description && (_jsx("p", { className: cn(config.description, 'text-muted-foreground mb-4'), children: description })), action && _jsx("div", { className: 'mt-6', children: action })] }));
};
