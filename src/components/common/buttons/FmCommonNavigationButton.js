import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';
export const FmCommonNavigationButton = ({ to, label, icon: Icon, variant = 'outline', className, description, }) => {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate(to);
    };
    return (_jsxs(Button, { onClick: handleClick, variant: variant, className: cn('w-full justify-start gap-3 h-auto py-3', variant === 'outline' &&
            'bg-white/5 border-white/30 hover:bg-fm-gold/20 hover:border-fm-gold hover:text-fm-gold transition-all', className), children: [_jsx(Icon, { className: 'h-4 w-4 flex-shrink-0' }), _jsxs("div", { className: 'flex flex-col items-start gap-0.5 text-left', children: [_jsx("span", { className: 'font-medium', children: label }), description && (_jsx("span", { className: 'text-xs text-white/50 font-normal', children: description }))] })] }));
};
