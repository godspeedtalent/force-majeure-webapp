import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Plus } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';
export const FmCommonCreateButton = ({ onClick, label, variant = 'outline', className, }) => {
    return (_jsxs(Button, { onClick: onClick, variant: variant, className: cn('justify-start gap-2', variant === 'outline' &&
            'bg-white/5 border-white/30 hover:bg-fm-gold/20 hover:border-fm-gold hover:text-fm-gold transition-all', className), children: [_jsx(Plus, { className: 'h-4 w-4' }), label] }));
};
