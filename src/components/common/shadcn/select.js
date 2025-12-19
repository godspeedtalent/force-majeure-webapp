import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/shared';
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (_jsxs(SelectPrimitive.Trigger, { ref: ref, className: cn(
    // Base styles
    'flex h-10 w-full items-center justify-between px-3 py-2 text-sm', 'bg-transparent border border-white/20', 'transition-all duration-300', 
    // Hover state
    'hover:border-fm-gold/50 hover:bg-white/5', 
    // Focus state - bottom border only with gold glow (matching FmCommonTextField)
    'focus:outline-none focus:border-b-[3px] focus:border-b-fm-gold focus:border-t-transparent focus:border-l-transparent focus:border-r-transparent', 'focus:shadow-[0_4px_16px_rgba(223,186,125,0.3)]', 
    // Open state
    'data-[state=open]:border-fm-gold/60 data-[state=open]:bg-white/5', 'data-[state=open]:shadow-[0_0_16px_rgba(223,186,125,0.2)]', 
    // Placeholder and text
    'placeholder:text-muted-foreground [&>span]:line-clamp-1', 
    // Disabled state
    'disabled:cursor-not-allowed disabled:opacity-50', className), ...props, children: [children, _jsx(SelectPrimitive.Icon, { asChild: true, children: _jsx(ChevronDown, { className: 'h-4 w-4 opacity-50 transition-transform duration-200 data-[state=open]:rotate-180' }) })] })));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (_jsx(SelectPrimitive.ScrollUpButton, { ref: ref, className: cn('flex cursor-default items-center justify-center py-1', className), ...props, children: _jsx(ChevronUp, { className: 'h-4 w-4' }) })));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (_jsx(SelectPrimitive.ScrollDownButton, { ref: ref, className: cn('flex cursor-default items-center justify-center py-1', className), ...props, children: _jsx(ChevronDown, { className: 'h-4 w-4' }) })));
SelectScrollDownButton.displayName =
    SelectPrimitive.ScrollDownButton.displayName;
const SelectContent = React.forwardRef(({ className, children, position = 'popper', ...props }, ref) => (_jsx(SelectPrimitive.Portal, { children: _jsxs(SelectPrimitive.Content, { ref: ref, className: cn(
        // Base styles matching context menu
        'relative z-[10000] max-h-96 min-w-[8rem] overflow-hidden', 'bg-black/80 backdrop-blur-lg', 'border border-white/20 border-l-[3px] border-l-fm-gold/60', 'shadow-lg shadow-black/50', 
        // Animation
        'data-[state=open]:animate-in data-[state=closed]:animate-out', 'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0', 'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', 'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2', 'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2', position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1', className), position: position, ...props, children: [_jsx(SelectScrollUpButton, {}), _jsx(SelectPrimitive.Viewport, { className: cn('p-1', position === 'popper' &&
                    'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'), children: children }), _jsx(SelectScrollDownButton, {})] }) })));
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (_jsx(SelectPrimitive.Label, { ref: ref, className: cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className), ...props })));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
const SelectItem = React.forwardRef(({ className, children, index = 0, ...props }, ref) => (_jsxs(SelectPrimitive.Item, { ref: ref, className: cn(
    // Base styles
    'relative flex w-full cursor-pointer select-none items-center py-2 pl-8 pr-3 text-sm outline-none', 'font-medium transition-all duration-300', 
    // Striped background - more apparent contrast
    'even:bg-white/10 odd:bg-black/40', 
    // Hover states matching context menu
    'hover:bg-fm-gold/15 hover:scale-[1.02] hover:shadow-lg hover:shadow-fm-gold/20 hover:text-white', 
    // Focus states
    'focus:bg-fm-gold/20 focus:scale-[1.02] focus:shadow-lg focus:shadow-fm-gold/25 focus:text-white', 
    // Active state for tactile feedback
    'active:scale-[0.98]', 
    // Selected state
    'data-[state=checked]:bg-fm-gold/25 data-[state=checked]:text-white', 
    // Disabled state
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50', 
    // Bottom divider
    'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-white/15 after:to-transparent', className), ...props, children: [_jsx("span", { className: 'absolute left-2 flex h-4 w-4 items-center justify-center', children: _jsx(SelectPrimitive.ItemIndicator, { children: _jsx(Check, { className: 'h-4 w-4 text-fm-gold' }) }) }), _jsx(SelectPrimitive.ItemText, { children: children })] })));
SelectItem.displayName = SelectPrimitive.Item.displayName;
const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (_jsx(SelectPrimitive.Separator, { ref: ref, className: cn('-mx-1 my-1 h-px bg-muted', className), ...props })));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton, };
