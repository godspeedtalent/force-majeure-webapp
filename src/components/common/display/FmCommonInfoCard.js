import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from '@/components/common/shadcn/card';
import { cn } from '@/shared';
const sizeConfig = {
    sm: {
        container: 'p-3',
        icon: 'w-4 h-4',
        label: 'text-xs',
        value: 'text-sm',
    },
    md: {
        container: 'p-4',
        icon: 'w-5 h-5',
        label: 'text-sm',
        value: 'text-base',
    },
    lg: {
        container: 'p-6',
        icon: 'w-6 h-6',
        label: 'text-base',
        value: 'text-lg',
    },
};
export const FmCommonInfoCard = ({ icon: Icon, label, value, size = 'md', layout = 'horizontal', className, iconClassName, }) => {
    const config = sizeConfig[size];
    return (_jsx(Card, { className: cn('border-border', 'transition-all duration-300', 'hover:bg-white/5', 'hover:border-fm-gold/50', 'hover:shadow-[0_0_12px_rgba(212,175,55,0.15)]', className), children: _jsxs(CardContent, { className: cn('flex gap-3', config.container, layout === 'vertical' ? 'flex-col items-start' : 'items-center'), children: [_jsx("div", { className: cn('flex items-center justify-center rounded-md bg-accent/10 p-2', layout === 'vertical' && 'w-full'), children: _jsx(Icon, { className: cn(config.icon, 'text-accent', iconClassName) }) }), _jsxs("div", { className: 'flex-1 min-w-0', children: [_jsx("p", { className: cn(config.label, 'text-muted-foreground font-medium'), children: label }), _jsx("div", { className: cn(config.value, 'text-foreground font-normal'), children: value })] })] }) }));
};
