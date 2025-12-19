import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Label } from '@/components/common/shadcn/label';
import { Input } from '@/components/common/shadcn/input';
import { Switch } from '@/components/common/shadcn/switch';
import { Calendar } from '@/components/common/shadcn/calendar';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/common/shadcn/popover';
import { Button } from '@/components/common/shadcn/button';
import { format as formatDate } from 'date-fns';
import { CalendarIcon, Check } from 'lucide-react';
import { cn } from '@/shared';
export function FmBulkEditField({ column, value, enabled, onToggle, onValueChange, }) {
    const renderInput = () => {
        switch (column.type) {
            case 'boolean':
                return (_jsx(Switch, { checked: value ?? false, onCheckedChange: onValueChange, disabled: !enabled }));
            case 'date':
                return (_jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: 'outline', className: cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground', !enabled && 'opacity-50'), disabled: !enabled, children: [_jsx(CalendarIcon, { className: 'mr-2 h-4 w-4' }), value ? formatDate(new Date(value), 'PPP') : 'Pick a date'] }) }), _jsx(PopoverContent, { className: 'w-auto p-0', align: 'start', children: _jsx(Calendar, { mode: 'single', selected: value ? new Date(value) : undefined, onSelect: date => onValueChange(date?.toISOString()), initialFocus: true }) })] }));
            case 'number':
                return (_jsx(Input, { type: 'number', value: value ?? '', onChange: e => onValueChange(parseFloat(e.target.value)), disabled: !enabled, placeholder: 'Enter number...' }));
            case 'email':
                return (_jsx(Input, { type: 'email', value: value ?? '', onChange: e => onValueChange(e.target.value), disabled: !enabled, placeholder: 'Enter email...' }));
            case 'url':
                return (_jsx(Input, { type: 'url', value: value ?? '', onChange: e => onValueChange(e.target.value), disabled: !enabled, placeholder: 'Enter URL...' }));
            default:
                return (_jsx(Input, { type: 'text', value: value ?? '', onChange: e => onValueChange(e.target.value), disabled: !enabled, placeholder: 'Enter value...' }));
        }
    };
    return (_jsxs("div", { className: cn('flex items-start gap-4 p-4 rounded-none border transition-colors', enabled ? 'bg-fm-gold/5 border-fm-gold/30' : 'bg-muted/20 border-border/50'), children: [_jsx("div", { className: 'flex items-center pt-2', children: _jsx(Switch, { checked: enabled, onCheckedChange: onToggle }) }), _jsxs("div", { className: 'flex-1 space-y-2', children: [_jsxs("div", { className: 'flex items-center justify-between', children: [_jsx(Label, { className: 'text-base font-medium', children: column.label }), column.required && (_jsx("span", { className: 'text-xs text-muted-foreground', children: "(Required)" }))] }), renderInput()] }), enabled && (_jsx("div", { className: 'pt-2', children: _jsx(Check, { className: 'h-5 w-5 text-fm-gold' }) }))] }));
}
