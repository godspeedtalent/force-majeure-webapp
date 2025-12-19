import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from '@/components/common/shadcn/badge';
import { Card, CardContent, CardHeader } from '@/components/common/shadcn/card';
import { cn } from '@/shared';
const sizeConfig = {
    sm: {
        value: 'text-2xl',
        label: 'text-xs',
        padding: 'p-4',
    },
    md: {
        value: 'text-3xl',
        label: 'text-sm',
        padding: 'p-6',
    },
    lg: {
        value: 'text-4xl',
        label: 'text-base',
        padding: 'p-8',
    },
};
export const FmCommonStatCard = ({ value, label, icon: Icon, description, badge, trend, size = 'md', className, }) => {
    const config = sizeConfig[size];
    return (_jsxs(Card, { className: cn('border-border transition-all duration-300', 'hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)]', 'hover:scale-[1.02]', className), children: [_jsx(CardHeader, { className: 'pb-2', children: _jsxs("div", { className: 'flex items-center justify-between', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [Icon && (_jsx(Icon, { className: 'w-4 h-4 text-muted-foreground transition-colors duration-300 group-hover:text-fm-gold' })), _jsx("p", { className: cn(config.label, 'text-muted-foreground font-medium'), children: label })] }), badge && (_jsx(Badge, { variant: badge.variant || 'secondary', children: badge.label }))] }) }), _jsxs(CardContent, { className: config.padding, children: [_jsxs("div", { className: 'flex items-baseline gap-2', children: [_jsx("p", { className: cn(config.value, 'font-bold text-foreground'), children: value }), trend && (_jsx("span", { className: cn('text-sm font-medium', trend.isPositive ? 'text-green-600' : 'text-red-600'), children: trend.value }))] }), description && (_jsx("p", { className: 'text-xs text-muted-foreground mt-1', children: description }))] })] }));
};
