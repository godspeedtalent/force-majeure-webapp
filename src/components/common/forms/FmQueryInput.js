import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, forwardRef } from 'react';
import { Input } from '@/components/common/shadcn/input';
import { Button } from '@/components/common/shadcn/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/shared';
export const FmQueryInput = forwardRef(({ placeholder, onQuery, isLoading = false, disabled = false, className }, ref) => {
    const [value, setValue] = useState('');
    const [isQuerying, setIsQuerying] = useState(false);
    const handleSubmit = async () => {
        if (!value.trim() || isQuerying || disabled)
            return;
        setIsQuerying(true);
        try {
            await onQuery(value.trim());
        }
        finally {
            setIsQuerying(false);
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };
    const isProcessing = isLoading || isQuerying;
    return (_jsxs("div", { className: cn('flex items-center gap-2', className), children: [_jsxs("div", { className: 'relative flex-1', children: [_jsx(Input, { ref: ref, type: 'text', placeholder: placeholder, value: value, onChange: e => setValue(e.target.value.toUpperCase()), onKeyDown: handleKeyDown, disabled: disabled || isProcessing, className: cn('pr-8 uppercase text-xs h-8', isProcessing && 'opacity-50') }), isProcessing && (_jsx("div", { className: 'absolute right-2 top-1/2 -translate-y-1/2', children: _jsx("div", { className: 'h-3 w-3 animate-spin rounded-full border-2 border-fm-gold border-b-transparent' }) }))] }), _jsx(Button, { size: 'sm', onClick: handleSubmit, disabled: !value.trim() || disabled || isProcessing, className: 'h-8 px-3 bg-fm-gold hover:bg-fm-gold/90 text-black font-medium', children: _jsx(ArrowRight, { className: 'h-3 w-3' }) })] }));
});
FmQueryInput.displayName = 'FmQueryInput';
