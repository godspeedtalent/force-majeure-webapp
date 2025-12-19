import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Textarea } from '@/components/common/shadcn/textarea';
import { Label } from '@/components/common/shadcn/label';
import { cn } from '@/shared';
/**
 * Enhanced text field component with beautiful focus animations and dopamine-inducing UX
 * Features smooth transitions, gold glow effects, and icon animations
 */
export const FmCommonTextField = React.forwardRef(({ label, required = false, description, error, containerClassName, className, id, disabled, prepend, password = false, type, multiline = false, rows = 3, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : `input-${Math.random().toString(36).substr(2, 9)}`);
    const inputType = password ? (showPassword ? 'text' : 'password') : type;
    const baseInputClasses = cn('transition-all duration-300', isFocused &&
        !disabled &&
        'shadow-[0_0_16px_rgba(207,173,118,0.3)] scale-[1.01]', error && 'border-red-500 focus:border-red-500');
    const renderInput = () => {
        // Multiline mode uses Textarea
        if (multiline) {
            return (_jsx(Textarea, { ref: ref, id: inputId, disabled: disabled, rows: rows, onFocus: () => setIsFocused(true), onBlur: () => setIsFocused(false), className: cn('resize-none', baseInputClasses, className), ...props }));
        }
        if (password) {
            return (_jsxs("div", { className: 'relative', children: [_jsx(Input, { ref: ref, id: inputId, type: inputType, disabled: disabled, onFocus: () => setIsFocused(true), onBlur: () => setIsFocused(false), className: cn('h-9 pr-10', baseInputClasses, className), ...props }), _jsx(Button, { type: 'button', variant: 'ghost', size: 'sm', className: 'absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent transition-all duration-200', onClick: () => setShowPassword(!showPassword), tabIndex: -1, children: showPassword ? (_jsx(EyeOff, { className: 'h-4 w-4 text-muted-foreground hover:text-fm-gold transition-colors duration-200 hover:scale-110' })) : (_jsx(Eye, { className: 'h-4 w-4 text-muted-foreground hover:text-fm-gold transition-colors duration-200 hover:scale-110' })) })] }));
        }
        if (prepend) {
            return (_jsxs("div", { className: 'relative flex items-center', children: [_jsx("div", { className: cn('absolute left-0 top-0 h-9 w-9 bg-muted flex items-center justify-center text-sm font-medium text-foreground/70 border-r border-border transition-all duration-300', isFocused && 'bg-fm-gold/20 text-fm-gold border-fm-gold'), children: prepend }), _jsx(Input, { ref: ref, id: inputId, type: inputType, disabled: disabled, onFocus: () => setIsFocused(true), onBlur: () => setIsFocused(false), className: cn('h-9 pl-11', baseInputClasses, className), ...props })] }));
        }
        return (_jsx(Input, { ref: ref, id: inputId, type: inputType, disabled: disabled, onFocus: () => setIsFocused(true), onBlur: () => setIsFocused(false), className: cn('h-9', baseInputClasses, className), ...props }));
    };
    return (_jsxs("div", { className: cn('space-y-1', containerClassName), children: [renderInput(), (label || description) && (_jsxs("div", { children: [label && (_jsxs(Label, { htmlFor: inputId, className: cn('text-xs transition-colors duration-200', isFocused ? 'text-fm-gold' : 'text-muted-foreground'), children: [label, " ", required && _jsx("span", { className: 'text-fm-gold', children: "*" })] })), description && (_jsx("p", { className: 'text-xs text-muted-foreground/70 mt-0.5', children: description }))] })), error && (_jsx("p", { className: 'text-xs text-red-500 mt-1 animate-in fade-in slide-in-from-top-1 duration-300', children: error }))] }));
});
FmCommonTextField.displayName = 'FmCommonTextField';
