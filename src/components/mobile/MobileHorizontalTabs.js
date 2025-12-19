import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';
/**
 * Mobile-only sticky horizontal tabs
 * Scrollable tabs that stick below the navigation bar
 * Only renders on mobile (< 768px)
 */
export const MobileHorizontalTabs = ({ tabs, activeTab, onTabChange, className, }) => {
    const isMobile = useIsMobile();
    const containerRef = useRef(null);
    const activeTabRef = useRef(null);
    // Auto-scroll active tab into view
    useEffect(() => {
        if (activeTabRef.current && containerRef.current) {
            const container = containerRef.current;
            const activeElement = activeTabRef.current;
            const containerWidth = container.offsetWidth;
            const activeLeft = activeElement.offsetLeft;
            const activeWidth = activeElement.offsetWidth;
            // Calculate scroll position to center the active tab
            const scrollPosition = activeLeft - containerWidth / 2 + activeWidth / 2;
            container.scrollTo({
                left: scrollPosition,
                behavior: 'smooth',
            });
        }
    }, [activeTab]);
    // Don't render on desktop
    if (!isMobile)
        return null;
    return (_jsx("div", { className: cn('z-30', 'bg-black/80 backdrop-blur-lg', 'border-b border-white/20', 'md:hidden', className), children: _jsx("div", { ref: containerRef, className: 'flex items-center overflow-x-auto scrollbar-hide px-[10px] py-[10px]', style: {
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }, children: tabs.map(tab => {
                const isActive = tab.id === activeTab;
                const Icon = tab.icon;
                return (_jsxs("button", { ref: isActive ? activeTabRef : null, onClick: () => onTabChange(tab.id), className: cn('flex-shrink-0 flex items-center gap-[5px]', 'px-[20px] py-[10px]', 'font-canela text-sm font-medium whitespace-nowrap', 'transition-all duration-200', 'rounded-none', 'border-b-2', isActive
                        ? 'text-fm-gold border-fm-gold'
                        : 'text-white/70 hover:text-fm-gold border-transparent hover:border-fm-gold/50'), "aria-label": tab.label, "aria-current": isActive ? 'page' : undefined, children: [Icon && (_jsx(Icon, { className: cn('w-[16px] h-[16px]', 'transition-colors duration-200') })), _jsx("span", { children: tab.label })] }, tab.id));
            }) }) }));
};
