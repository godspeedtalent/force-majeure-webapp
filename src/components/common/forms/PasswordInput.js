import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
export function PasswordInput({ id, placeholder, value, onChange, required = false, className = '', }) {
    const { t } = useTranslation('common');
    const resolvedPlaceholder = placeholder ?? t('passwordInput.enterPassword');
    const [showPassword, setShowPassword] = useState(false);
    return (_jsxs("div", { className: 'relative', children: [_jsx(Input, { id: id, type: showPassword ? 'text' : 'password', placeholder: resolvedPlaceholder, value: value, onChange: e => onChange(e.target.value), required: required, className: `pr-12 ${className}` }), _jsx(Button, { type: 'button', variant: 'ghost', size: 'sm', className: 'absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent', onClick: () => setShowPassword(!showPassword), children: showPassword ? (_jsx(EyeOff, { className: 'h-4 w-4 text-muted-foreground' })) : (_jsx(Eye, { className: 'h-4 w-4 text-muted-foreground' })) })] }));
}
