import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Label } from '@/components/common/shadcn/label';
import { Switch } from '@/components/common/shadcn/switch';
import { cn } from '@/shared';
/**
 * Enhanced toggle component with smooth animations and dopamine-inducing interactions
 * Features icon bounce on toggle and enhanced shadow effects
 */
export const FmCommonToggle = ({ id, label, icon: Icon, checked, onCheckedChange, disabled = false, className = '', hideLabel = false, size = 'default', }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const isSmall = size === 'sm';
    const handleToggle = (newChecked) => {
        if (!disabled) {
            setIsAnimating(true);
            onCheckedChange(newChecked);
            setTimeout(() => setIsAnimating(false), 300);
        }
    };
    return (_jsxs("div", { className: cn('flex items-center justify-between group transition-all duration-300 rounded-none', isSmall ? 'px-1.5 py-0.5' : 'px-3 py-2', !disabled &&
            'hover:bg-white/5 hover:shadow-[0_0_16px_rgba(207,173,118,0.3)] cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', checked && !disabled && 'bg-fm-gold/10', className), onClick: () => !disabled && handleToggle(!checked), children: [!hideLabel && (_jsxs(Label, { htmlFor: id, className: cn('flex items-center gap-2 text-white transition-all duration-200', isSmall && 'text-xs gap-1.5', !disabled &&
                    'cursor-pointer group-hover:text-fm-gold group-hover:translate-x-1', disabled && 'cursor-not-allowed'), children: [Icon && (_jsx(Icon, { className: cn('transition-all duration-300', isSmall ? 'h-3 w-3' : 'h-4 w-4', isAnimating && 'scale-125 rotate-12', checked && 'text-fm-gold') })), _jsx("span", { className: 'transition-all duration-200', children: label })] })), _jsx(Switch, { id: id, checked: checked, onCheckedChange: handleToggle, disabled: disabled, className: cn('data-[state=checked]:bg-fm-gold transition-all duration-300', isSmall && 'scale-75', !disabled &&
                    'group-hover:shadow-[0_0_12px_rgba(207,173,118,0.5)] group-hover:scale-110', isAnimating && 'scale-110', checked && 'shadow-[0_0_8px_rgba(207,173,118,0.4)]') })] }));
};
