import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ExternalLink } from 'lucide-react';
import * as React from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar, } from '@/components/common/shadcn/sidebar';
import { cn } from '@/shared';
/**
 * FmCommonSideNav - A beautiful, interactive side navigation component
 *
 * Features:
 * - Collapsible to icon-only mode
 * - Grouped navigation items with labels
 * - Gold highlight for active items
 * - Smooth animations and hover effects
 * - Ripple effects on click
 * - Tooltip support when collapsed
 * - Keyboard accessible
 */
export function FmCommonSideNav({ groups, activeItem, onItemChange, className, showDividers = true, }) {
    const { open } = useSidebar();
    const [clickedItem, setClickedItem] = React.useState(null);
    const [previousItem, setPreviousItem] = React.useState(null);
    // Track item changes for fade-out effect
    React.useEffect(() => {
        if (activeItem !== previousItem) {
            setPreviousItem(activeItem);
        }
    }, [activeItem, previousItem]);
    const handleItemClick = (itemId) => {
        setClickedItem(itemId);
        onItemChange(itemId);
        // Clear ripple after animation
        setTimeout(() => {
            setClickedItem(null);
        }, 600);
    };
    return (_jsx(Sidebar, { className: cn('border-r border-white/20 bg-black/40', className), collapsible: 'icon', children: _jsxs(SidebarContent, { className: 'pt-4', children: [_jsx("div", { className: 'px-2 mb-4', children: _jsx(SidebarTrigger, { className: cn('hover:bg-fm-gold/20 transition-all duration-300', 'hover:scale-105 active:scale-95', 'hover:shadow-[0_0_16px_rgba(212,175,55,0.3)]') }) }), groups.map((group, groupIndex) => (_jsxs("div", { children: [showDividers &&
                            groupIndex > 0 &&
                            (open ? (_jsx("div", { className: 'px-4 my-3', children: _jsx("div", { className: 'h-px bg-gradient-to-r from-transparent via-white/20 to-transparent' }) })) : (_jsx("div", { className: 'px-2 my-3', children: _jsx("div", { className: 'h-px bg-gradient-to-r from-transparent via-white/20 to-transparent' }) }))), _jsxs(SidebarGroup, { children: [group.label && open && (_jsxs(SidebarGroupLabel, { className: cn('text-white/90 px-4 flex items-center gap-2', 'rounded-md text-base font-semibold mb-1'), children: [group.icon && _jsx(group.icon, { className: 'h-4 w-4' }), group.label] })), _jsx(SidebarGroupContent, { children: _jsx(SidebarMenu, { children: group.items.map(item => {
                                            const isActive = activeItem === item.id;
                                            const isPrevious = previousItem === item.id && !isActive;
                                            const showRipple = clickedItem === item.id;
                                            const isExternal = item.isExternal;
                                            return (_jsx(SidebarMenuItem, { children: _jsxs(SidebarMenuButton, { onClick: () => handleItemClick(item.id), className: cn('cursor-pointer transition-all duration-200', 'relative overflow-hidden', open ? 'justify-start pl-4' : 'justify-center', 
                                                    // External item styling - frosted glass background
                                                    isExternal && [
                                                        'bg-white/5 backdrop-blur-sm',
                                                        'border border-white/10',
                                                        'hover:bg-white/10 hover:border-white/20',
                                                        'hover:shadow-[0_0_12px_rgba(255,255,255,0.1)]',
                                                    ], 
                                                    // Hover effects (non-external, non-active)
                                                    !isActive &&
                                                        !isExternal &&
                                                        'hover:bg-white/5 hover:translate-x-0.5', 
                                                    // Active state
                                                    isActive && [
                                                        'bg-fm-gold/20 text-fm-gold',
                                                        'hover:bg-fm-gold/30',
                                                        'shadow-[0_0_12px_rgba(212,175,55,0.2)]',
                                                        'border-l-2 border-fm-gold',
                                                    ], 
                                                    // Previous item fade out
                                                    isPrevious && 'bg-fm-gold/20 animate-fade-out'), tooltip: item.description || item.label, children: [_jsx(item.icon, { className: cn('h-4 w-4 transition-transform duration-200', isActive && 'scale-110') }), open && (_jsxs("span", { className: cn('ml-3 transition-all duration-200 flex items-center gap-1.5 flex-1', isActive && 'font-semibold'), children: [item.label, isExternal && (_jsx(ExternalLink, { className: 'h-3 w-3 ml-auto text-white/50' })), item.badge && !isExternal && _jsx("span", { className: 'ml-auto', children: item.badge })] })), isActive && (_jsx("div", { className: 'absolute inset-0 bg-gradient-to-r from-fm-gold/10 to-transparent animate-pulse' })), showRipple && (_jsx("span", { className: 'absolute inset-0 bg-fm-gold/40 animate-ripple rounded-none', style: {
                                                                transformOrigin: 'center',
                                                            } }))] }) }, item.id));
                                        }) }) })] })] }, groupIndex)))] }) }));
}
