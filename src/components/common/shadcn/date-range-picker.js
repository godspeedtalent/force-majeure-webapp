import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/common/shadcn/button";
import { Calendar } from "@/components/common/shadcn/calendar";
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/common/shadcn/popover";
export function DatePickerWithRange({ date, onDateChange, className, }) {
    return (_jsx("div", { className: `grid gap-2 ${className || ''}`, children: _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { id: "date", variant: "outline", size: "sm", className: `justify-start text-left font-normal ${!date ? "text-muted-foreground" : ""}`, children: [_jsx(CalendarIcon, { className: "mr-2 h-4 w-4" }), date?.from ? (date.to ? (_jsxs(_Fragment, { children: [format(date.from, "LLL dd, y"), " -", " ", format(date.to, "LLL dd, y")] })) : (format(date.from, "LLL dd, y"))) : (_jsx("span", { children: "Pick a date range" }))] }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "end", children: _jsx(Calendar, { initialFocus: true, mode: "range", defaultMonth: date?.from, selected: date, onSelect: onDateChange, numberOfMonths: 2 }) })] }) }));
}
