import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/shadcn/select';
import { Label } from '@/components/common/shadcn/label';
import { cn } from '@/shared';
/**
 * Enhanced select component with beautiful focus animations and dopamine-inducing UX
 * Features smooth transitions and gold glow effects to match FmCommonTextField
 */
export function FmCommonSelect({ label, id, value, onChange, options = [], placeholder, description, error, required = false, className, containerClassName, disabled, }) {
    const [isFocused, setIsFocused] = React.useState(false);
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (_jsxs("div", { className: cn('space-y-1', containerClassName), children: [_jsxs(Select, { value: value, onValueChange: onChange, disabled: disabled, onOpenChange: open => setIsFocused(open), children: [_jsx(SelectTrigger, { id: selectId, className: cn('w-full h-9 transition-all duration-300', isFocused &&
                            !disabled &&
                            'shadow-[0_0_16px_rgba(207,173,118,0.3)] scale-[1.01]', error && 'border-red-500 focus:border-red-500', className), children: _jsx(SelectValue, { placeholder: placeholder }) }), _jsx(SelectContent, { children: options.map(option => (_jsx(SelectItem, { value: option.value, children: _jsxs("div", { className: 'flex items-center gap-2', children: [option.icon && _jsx(option.icon, { className: 'h-4 w-4' }), _jsx("span", { children: option.label })] }) }, option.value))) })] }), _jsxs("div", { children: [label && (_jsxs(Label, { htmlFor: selectId, className: cn('text-xs transition-colors duration-200', isFocused ? 'text-fm-gold' : 'text-muted-foreground'), children: [label, " ", required && _jsx("span", { className: 'text-fm-gold', children: "*" })] })), description && (_jsx("p", { className: 'text-xs text-muted-foreground/70 mt-0.5', children: description }))] }), error && (_jsx("p", { className: 'text-xs text-red-500 mt-1 animate-in fade-in slide-in-from-top-1 duration-300', children: error }))] }));
}
