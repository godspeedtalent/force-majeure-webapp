import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';
import { Navigation } from '@/components/navigation/Navigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { FmCommonSideNav, } from '@/components/common/navigation/FmCommonSideNav';
import { SidebarProvider } from '@/components/common/shadcn/sidebar';
import { FmBackButton } from '@/components/common/buttons/FmBackButton';
/**
 * SideNavbarLayout - Layout for pages with a collapsible sidebar navigation
 *
 * Features:
 * - Top navigation bar
 * - Collapsible sidebar with FmCommonSideNav
 * - Topographic background with gradient overlay
 * - Full-height flex layout
 * - Site-wide tools (Music Player, Dev Tools) are handled at the App level
 *
 * Use this for admin panels, management pages, or any page that needs persistent sidebar navigation.
 */
export const SideNavbarLayout = ({ children, navigationGroups, activeItem, onItemChange, showDividers = false, defaultOpen = true, backgroundOpacity = 0.35, className = '', mobileTabBar, mobileHorizontalTabs, showBackButton = false, onBack, backButtonLabel, backButtonActions, }) => {
    const isMobile = useIsMobile();
    return (_jsxs(_Fragment, { children: [_jsx(Navigation, {}), mobileHorizontalTabs, _jsx(SidebarProvider, { defaultOpen: defaultOpen, children: _jsxs("div", { className: 'flex min-h-screen w-full', children: [_jsx("div", { className: cn(mobileTabBar && isMobile ? 'hidden' : 'block'), children: _jsx(FmCommonSideNav, { groups: navigationGroups, activeItem: activeItem, onItemChange: onItemChange, showDividers: showDividers }) }), _jsxs("main", { className: cn('flex-1 relative overflow-hidden', !isMobile && 'pb-6 px-6', className), children: [_jsx(TopographicBackground, { opacity: backgroundOpacity }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' }), _jsxs("div", { className: cn('max-w-full relative z-10', isMobile ? 'h-full overflow-y-auto px-4 py-4' : 'm-10', isMobile && mobileTabBar && 'pb-[100px]' // Extra padding for tab bar
                                    ), children: [(showBackButton || backButtonActions) && (_jsxs("div", { className: 'absolute top-[20px] left-[20px] right-[20px] z-20 flex items-center justify-between', children: [showBackButton ? (_jsx(FmBackButton, { position: 'inline', onClick: onBack, label: backButtonLabel })) : (_jsx("div", {})), backButtonActions] })), children] })] })] }) }), mobileTabBar] }));
};
