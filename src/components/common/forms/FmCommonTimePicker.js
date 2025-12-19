import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { cn } from '@/shared';
import { Input } from '@/components/common/shadcn/input';
export function FmCommonTimePicker({ value = '21:00', onChange, placeholder, disabled = false, className, }) {
    const { t } = useTranslation('common');
    const resolvedPlaceholder = placeholder ?? t('timePicker.selectTime');
    return (_jsxs("div", { className: cn('relative', className), children: [_jsx(Input, { type: 'time', value: value, onChange: e => onChange(e.target.value), disabled: disabled, className: cn('bg-black/40 border-white/20 text-white pl-10', disabled && 'opacity-50 cursor-not-allowed'), placeholder: resolvedPlaceholder }), _jsx(Clock, { className: 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none' })] }));
}
