import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/shared';
import { Button } from '@/components/common/shadcn/button';
import { Calendar } from '@/components/common/shadcn/calendar';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/common/shadcn/popover';
export function FmCommonDatePicker({ value, onChange, placeholder, disabled = false, disablePastDates = true, }) {
    const { t } = useTranslation('common');
    const resolvedPlaceholder = placeholder ?? t('datePicker.pickDate');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (_jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, disabled: disabled, children: _jsxs(Button, { variant: 'outline', className: cn('w-full justify-start text-left font-normal', 'bg-black/40 border-white/20 hover:border-fm-gold/50', 'text-white hover:bg-black/60 hover:text-white', !value && 'text-white/50', disabled && 'opacity-50 cursor-not-allowed'), children: [_jsx(CalendarIcon, { className: 'mr-2 h-4 w-4' }), value ? format(value, 'PPP') : _jsx("span", { children: resolvedPlaceholder })] }) }), _jsx(PopoverContent, { className: 'w-auto p-0 bg-black/90 backdrop-blur-md border border-white/20 pointer-events-auto', align: 'start', children: _jsx(Calendar, { mode: 'single', selected: value, onSelect: onChange, disabled: disablePastDates ? date => date < today : undefined, initialFocus: true, className: 'pointer-events-auto', classNames: {
                        day_selected: 'bg-fm-gold text-black hover:bg-fm-gold hover:text-black focus:bg-fm-gold focus:text-black',
                    } }) })] }));
}
