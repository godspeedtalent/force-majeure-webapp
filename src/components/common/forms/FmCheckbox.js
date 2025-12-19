import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Label } from '@/components/common/shadcn/label';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { cn } from '@/shared';
/**
 * Checkbox component with hover effects similar to FmCommonToggle
 * Features smooth animations and icon interactions
 */
export const FmCheckbox = ({ id, label, icon: Icon, checked, onCheckedChange, disabled = false, className = '', }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const handleToggle = (newChecked) => {
        if (!disabled && typeof newChecked === 'boolean') {
            setIsAnimating(true);
            onCheckedChange(newChecked);
            setTimeout(() => setIsAnimating(false), 300);
        }
    };
    return (_jsxs("div", { className: cn('flex items-center justify-between group transition-all duration-300 rounded-none px-3 py-2', !disabled &&
            'hover:bg-white/5 hover:shadow-[0_0_16px_rgba(207,173,118,0.3)] cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', checked && !disabled && 'bg-fm-gold/10', className), onClick: () => !disabled && handleToggle(!checked), children: [_jsxs(Label, { htmlFor: id, className: cn('flex items-center gap-2 text-white transition-all duration-200 flex-1', !disabled &&
                    'cursor-pointer group-hover:text-fm-gold group-hover:translate-x-1', disabled && 'cursor-not-allowed'), children: [Icon && (_jsx(Icon, { className: cn('h-4 w-4 transition-all duration-300', isAnimating && 'scale-125 rotate-12', checked && 'text-fm-gold') })), _jsx("span", { className: 'transition-all duration-200', children: label })] }), _jsx(Checkbox, { id: id, checked: checked, onCheckedChange: handleToggle, disabled: disabled, className: cn('transition-all duration-300 border-white/50', !disabled &&
                    'group-hover:border-fm-gold group-hover:shadow-[0_0_12px_rgba(207,173,118,0.5)] group-hover:scale-110', isAnimating && 'scale-110', checked && 'border-fm-gold shadow-[0_0_8px_rgba(207,173,118,0.4)]') })] }));
};
