import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';
/**
 * Mobile-only bottom tab bar with horizontal scrolling
 * Replaces sidebar navigation on mobile devices
 * Only renders on mobile (< 768px)
 */
export const MobileBottomTabBar = ({ tabs, activeTab, onTabChange, className, }) => {
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
    return (_jsx("div", { className: cn('fixed bottom-0 left-0 right-0 z-40', 'bg-black/80 backdrop-blur-lg', 'border-t border-white/20', 'md:hidden', 'pb-[env(safe-area-inset-bottom)]', // iOS safe area
        className), children: _jsx("div", { ref: containerRef, className: 'flex items-center overflow-x-auto scrollbar-hide px-[10px] py-[10px]', style: {
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }, children: tabs.map(tab => {
                const isActive = tab.id === activeTab;
                const Icon = tab.icon;
                return (_jsxs("button", { ref: isActive ? activeTabRef : null, onClick: () => onTabChange(tab.id), className: cn('flex-shrink-0 flex flex-col items-center justify-center', 'min-w-[80px] h-[50px]', 'px-[10px] py-[5px]', 'font-canela text-xs font-medium', 'transition-all duration-200', 'rounded-none', 'border-b-2', isActive
                        ? 'bg-fm-gold text-black border-fm-gold'
                        : 'bg-transparent text-white/70 hover:text-fm-gold border-transparent hover:border-fm-gold/50'), "aria-label": tab.label, "aria-current": isActive ? 'page' : undefined, children: [Icon && (_jsx(Icon, { className: cn('w-[20px] h-[20px] mb-[5px]', 'transition-colors duration-200') })), _jsx("span", { className: 'truncate max-w-full', children: tab.label })] }, tab.id));
            }) }) }));
};
