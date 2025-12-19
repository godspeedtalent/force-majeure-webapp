import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuGroup, } from '@/components/common/shadcn/dropdown-menu';
import { cn } from '@/shared';
/**
 * Renders a single dropdown item with consistent styling
 */
function DropdownItemRenderer({ item, index, totalItems, }) {
    return (_jsxs(React.Fragment, { children: [item.separator && (_jsx("div", { className: 'h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1' })), _jsxs(DropdownMenuItem, { onClick: item.onClick, className: cn('group cursor-pointer rounded-md my-0.5 relative', 
                // Transparent backgrounds to let frosted glass show through
                index % 2 === 0 ? 'bg-white/[0.02]' : 'bg-white/[0.06]', 'hover:bg-fm-gold/15 hover:scale-[1.02] hover:shadow-lg hover:shadow-fm-gold/20 hover:text-white', 'focus:bg-fm-gold/20 focus:scale-[1.02] focus:shadow-lg focus:shadow-fm-gold/20 focus:text-white', 'active:scale-[0.98] transition-all duration-300', item.variant === 'destructive' &&
                    'text-destructive hover:bg-destructive/15 hover:shadow-destructive/20 focus:bg-destructive/20 focus:shadow-destructive/20 hover:text-destructive', item.variant === 'muted' &&
                    'text-white/70 hover:bg-white/10 hover:shadow-white/10 focus:bg-white/15 focus:shadow-white/10 hover:text-white'), children: [item.icon && (_jsx("span", { className: 'mr-2 transition-transform duration-300 group-hover:scale-110', children: _jsx(item.icon, { className: 'h-4 w-4' }) })), _jsxs("span", { className: 'flex items-center flex-1 font-medium', children: [item.label, item.badge && _jsx("span", { className: 'ml-auto', children: item.badge })] }), index < totalItems - 1 && (_jsx("div", { className: 'absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent' }))] })] }));
}
/**
 * Reusable dropdown component with consistent styling
 * Supports both flat items list and grouped sections
 */
export function FmCommonDropdown({ trigger, items, sections, align = 'end', hideChevron = false, }) {
    // Convert flat items to sections format for unified rendering
    const effectiveSections = React.useMemo(() => {
        if (sections)
            return sections;
        if (items)
            return [{ items }];
        return [];
    }, [sections, items]);
    // Calculate total items for striping
    const allItems = effectiveSections.flatMap(s => s.items);
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, className: 'w-full', children: _jsxs("div", { className: 'relative w-full cursor-pointer', children: [trigger, !hideChevron && (_jsx(ChevronDown, { className: 'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-white/70 transition-colors' }))] }) }), _jsx(DropdownMenuContent, { align: align, className: cn('w-56 z-[200]', 'bg-black/90 backdrop-blur-xl', 'border border-white/20 border-l-[3px] border-l-fm-gold/60 shadow-lg shadow-black/50', 'animate-in fade-in zoom-in-95 duration-200', 'p-1'), children: effectiveSections.map((section, sectionIndex) => {
                    // Calculate global index offset for this section
                    const previousItemsCount = effectiveSections
                        .slice(0, sectionIndex)
                        .reduce((acc, s) => acc + s.items.length, 0);
                    return (_jsxs(React.Fragment, { children: [sectionIndex > 0 && (_jsx("div", { className: 'h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-[10px]' })), section.label && (_jsx(DropdownMenuLabel, { className: 'px-[15px] py-[8px] text-[10px] uppercase tracking-[0.2em] text-fm-gold/70 font-normal', children: section.label })), _jsx(DropdownMenuGroup, { children: section.items.map((item, itemIndex) => (_jsx(DropdownItemRenderer, { item: item, index: previousItemsCount + itemIndex, totalItems: allItems.length }, item.label))) })] }, sectionIndex));
                }) })] }));
}
