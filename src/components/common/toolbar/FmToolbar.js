import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { Database, Compass, ShoppingCart, ToggleLeft, ClipboardList, X, Building2, Scan, UserCog, } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared';
import { FmCommonTab } from '@/components/common/data/FmCommonTab';
import { Button } from '@/components/common/shadcn/button';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared';
import { useShoppingCart } from '@/shared';
// Import tab components
import { CartTabContent } from './tabs/CartTab';
import { OrgDashboardTabContent, ScanTicketsTabContent } from './tabs/OrganizationTab';
import { DatabaseTabContent, DatabaseTabFooter } from './tabs/DatabaseTab';
import { FeatureTogglesTabContent } from './tabs/FeatureTogglesTab';
import { DevNotesTabContent } from './tabs/DevNotesTab';
import { DevNavigationTabContent } from './tabs/DevNavigationTab';
import { MockRoleTabContent } from './tabs/MockRoleTab';
export const FmToolbar = ({ className, anchorOffset = 96 }) => {
    const { t } = useTranslation('common');
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [drawerWidth, setDrawerWidth] = useState(() => {
        // Load saved width from localStorage, default to 384px (20% wider than 320px)
        const saved = localStorage.getItem('fm-toolbar-width');
        return saved ? parseInt(saved, 10) : 384;
    });
    const [isTabHovered, setIsTabHovered] = useState(false);
    const [showGroupLabel, setShowGroupLabel] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(null);
    const { user, profile } = useAuth();
    const { hasAnyRole } = useUserPermissions();
    const { getTotalItems } = useShoppingCart();
    const navigate = useNavigate();
    const startYRef = useRef(0);
    const startXRef = useRef(0);
    const initialOffsetRef = useRef(0);
    const initialWidthRef = useRef(384);
    const tabsContainerRef = useRef(null);
    const dragStartTimeRef = useRef(0);
    const hoverTimeoutRef = useRef(null);
    // Constraints for drawer width
    const MIN_WIDTH = 320;
    // Check if user has actual developer or admin role
    const isDeveloperOrAdmin = hasAnyRole(ROLES.DEVELOPER, ROLES.ADMIN);
    const isAdmin = hasAnyRole(ROLES.ADMIN);
    // Check if user has items in cart
    const hasCartItems = getTotalItems() > 0;
    // Check if user has organization access
    // Admins/Developers always have access, org staff need organization_id
    const hasOrganizationAccess = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER) ||
        (profile?.organization_id &&
            hasAnyRole(ROLES.ORG_ADMIN, ROLES.ORG_STAFF));
    // Helper to navigate and close drawer
    const handleNavigate = useCallback((path) => {
        setIsOpen(false);
        setActiveTab(null);
        navigate(path);
    }, [navigate]);
    // Define all tabs based on user roles/permissions
    const tabs = useMemo(() => [
        {
            id: 'cart',
            label: t('toolbar.shoppingCart'),
            icon: ShoppingCart,
            content: _jsx(CartTabContent, {}),
            title: t('toolbar.shoppingCart'),
            visible: Boolean(user) && hasCartItems,
            group: 'user',
            groupOrder: 1,
            alignment: 'top',
        },
        {
            id: 'org-dashboard',
            label: t('toolbar.orgDashboard'),
            icon: Building2,
            content: _jsx(OrgDashboardTabContent, { onNavigate: handleNavigate }),
            title: t('toolbar.orgDashboard'),
            visible: Boolean(hasOrganizationAccess),
            group: 'organization',
            groupOrder: 2,
            alignment: 'top',
            groupLabel: t('toolbar.groups.organization'),
        },
        {
            id: 'scan-tickets',
            label: t('toolbar.scanTickets'),
            icon: Scan,
            content: _jsx(ScanTicketsTabContent, { onNavigate: handleNavigate }),
            title: t('toolbar.scanTickets'),
            visible: Boolean(hasOrganizationAccess),
            group: 'organization',
            groupOrder: 2,
            alignment: 'top',
            groupLabel: t('toolbar.groups.organization'),
        },
        {
            id: 'tools',
            label: t('toolbar.devNavigation'),
            icon: Compass,
            content: _jsx(DevNavigationTabContent, { onNavigate: handleNavigate, isAdmin: isAdmin }),
            title: t('toolbar.devNavigation'),
            visible: isDeveloperOrAdmin,
            group: 'developer',
            groupOrder: 2,
            alignment: 'bottom',
            groupLabel: t('toolbar.groups.developerTools'),
        },
        {
            id: 'mock-role',
            label: t('toolbar.mockRole'),
            icon: UserCog,
            content: _jsx(MockRoleTabContent, {}),
            title: t('toolbar.mockRoleSimulator'),
            visible: isDeveloperOrAdmin,
            group: 'developer',
            groupOrder: 2,
            alignment: 'bottom',
            groupLabel: t('toolbar.groups.developerTools'),
        },
        {
            id: 'database',
            label: t('toolbar.database'),
            icon: Database,
            content: _jsx(DatabaseTabContent, {}),
            footer: _jsx(DatabaseTabFooter, { onNavigate: handleNavigate }),
            title: t('toolbar.databaseManager'),
            visible: isDeveloperOrAdmin,
            group: 'developer',
            groupOrder: 2,
            alignment: 'bottom',
            groupLabel: t('toolbar.groups.developerTools'),
            resizable: true,
        },
        {
            id: 'features',
            label: t('toolbar.featureToggles'),
            icon: ToggleLeft,
            content: _jsx(FeatureTogglesTabContent, {}),
            title: t('toolbar.featureToggles'),
            visible: isDeveloperOrAdmin,
            group: 'developer',
            groupOrder: 2,
            alignment: 'bottom',
            groupLabel: t('toolbar.groups.developerTools'),
        },
        {
            id: 'notes',
            label: t('toolbar.todoNotes'),
            icon: ClipboardList,
            content: _jsx(DevNotesTabContent, {}),
            title: t('toolbar.devNotes'),
            visible: isDeveloperOrAdmin,
            group: 'developer',
            groupOrder: 2,
            alignment: 'bottom',
            groupLabel: t('toolbar.groups.developerTools'),
            resizable: true,
            maxWidth: Math.floor(window.innerWidth * 0.4), // 40vw
        },
    ], [isDeveloperOrAdmin, isAdmin, user, profile, hasOrganizationAccess, navigate, t]);
    const visibleTabs = useMemo(() => {
        const filtered = tabs.filter(tab => tab.visible !== false);
        // Sort by groupOrder first, then by order in array
        return filtered.sort((a, b) => {
            const orderA = a.groupOrder ?? 999;
            const orderB = b.groupOrder ?? 999;
            return orderA - orderB;
        });
    }, [tabs]);
    // Group tabs by their alignment and group property for rendering
    const { topGroups, bottomGroups } = useMemo(() => {
        const topTabs = visibleTabs.filter(tab => tab.alignment === 'top');
        const bottomTabs = visibleTabs.filter(tab => tab.alignment !== 'top');
        const createGroups = (tabs) => {
            const groups = [];
            let currentGroup;
            let currentTabs = [];
            tabs.forEach((tab, index) => {
                if (tab.group !== currentGroup && currentTabs.length > 0) {
                    groups.push({ group: currentGroup || 'default', tabs: currentTabs });
                    currentTabs = [];
                }
                currentGroup = tab.group;
                currentTabs.push(tab);
                // Push the last group
                if (index === tabs.length - 1) {
                    groups.push({ group: currentGroup || 'default', tabs: currentTabs });
                }
            });
            return groups;
        };
        return {
            topGroups: createGroups(topTabs),
            bottomGroups: createGroups(bottomTabs),
        };
    }, [visibleTabs]);
    const activeTabData = useMemo(() => visibleTabs.find(tab => tab.id === activeTab), [visibleTabs, activeTab]);
    // Calculate max width based on active tab or default to 80vw
    const getMaxWidth = useCallback(() => {
        if (activeTabData?.maxWidth !== undefined) {
            return activeTabData.maxWidth;
        }
        // Default max width is 80vw
        return Math.floor(window.innerWidth * 0.8);
    }, [activeTabData]);
    const handleTabClick = (tabId) => {
        if (activeTab === tabId && isOpen) {
            setIsOpen(false);
            return;
        }
        setActiveTab(tabId);
        if (!isOpen) {
            setIsOpen(true);
        }
        // If switching to a non-resizable tab, snap back to default width
        const newTab = visibleTabs.find(tab => tab.id === tabId);
        if (newTab && !newTab.resizable && drawerWidth > 384) {
            setDrawerWidth(384);
            localStorage.setItem('fm-toolbar-width', '384');
        }
    };
    const handleGroupMouseEnter = (groupName) => {
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        // Set timeout to show label after 1 second
        hoverTimeoutRef.current = setTimeout(() => {
            setShowGroupLabel(groupName);
        }, 1000);
    };
    const handleGroupMouseLeave = () => {
        // Clear timeout if user leaves before 1 second
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        // Fade out immediately
        setShowGroupLabel(null);
    };
    const handleMouseDown = (event) => {
        event.preventDefault();
        dragStartTimeRef.current = Date.now();
        startYRef.current = event.clientY;
        initialOffsetRef.current = dragOffset;
        setIsDragging(true);
    };
    const handleResizeStart = (event) => {
        event.preventDefault();
        event.stopPropagation();
        startXRef.current = event.clientX;
        initialWidthRef.current = drawerWidth;
        setIsResizing(true);
    };
    const handleResizeMove = useCallback((event) => {
        const deltaX = startXRef.current - event.clientX; // Reversed: dragging left increases width
        const maxWidth = getMaxWidth();
        const newWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, initialWidthRef.current + deltaX));
        setDrawerWidth(newWidth);
    }, [MIN_WIDTH, getMaxWidth]);
    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
        // Save to localStorage
        localStorage.setItem('fm-toolbar-width', drawerWidth.toString());
    }, [drawerWidth]);
    const handleMouseMove = useCallback((event) => {
        if (!tabsContainerRef.current)
            return;
        const deltaY = event.clientY - startYRef.current;
        const containerHeight = tabsContainerRef.current.offsetHeight;
        const viewportHeight = window.innerHeight - anchorOffset;
        const maxOffset = 0;
        const minOffset = Math.min(0, -(containerHeight - viewportHeight));
        const nextOffset = Math.max(minOffset, Math.min(maxOffset, initialOffsetRef.current + deltaY));
        setDragOffset(nextOffset);
    }, [anchorOffset]);
    const handleMouseUp = useCallback(() => {
        const dragDuration = Date.now() - dragStartTimeRef.current;
        const dragDistance = Math.abs(dragOffset - initialOffsetRef.current);
        if (dragDuration < 200 && dragDistance < 5) {
            setDragOffset(initialOffsetRef.current);
        }
        setIsDragging(false);
    }, [dragOffset]);
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
        return undefined;
    }, [isDragging, handleMouseMove, handleMouseUp]);
    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            return () => {
                window.removeEventListener('mousemove', handleResizeMove);
                window.removeEventListener('mouseup', handleResizeEnd);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
        }
        return undefined;
    }, [isResizing, handleResizeMove, handleResizeEnd]);
    // Cleanup hover timeout on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);
    // Auto-select first tab when drawer opens
    useEffect(() => {
        if (visibleTabs.length === 0) {
            setActiveTab(null);
            return;
        }
        // Only auto-select first tab if drawer is open and no valid tab is selected
        if (isOpen &&
            (!activeTab || !visibleTabs.some(tab => tab.id === activeTab))) {
            setActiveTab(visibleTabs[0].id);
        }
        // Clear active tab when drawer closes
        if (!isOpen && activeTab) {
            setActiveTab(null);
        }
    }, [visibleTabs, activeTab, isOpen]);
    if (visibleTabs.length === 0) {
        return null;
    }
    return (_jsxs("div", { className: cn('fixed bottom-0 right-0 z-[100]', 'hidden md:block', !isResizing && 'transition-all duration-300 ease-in-out', className), style: {
            width: isOpen ? `${drawerWidth}px` : '0px',
        }, children: [isOpen && activeTabData?.resizable && (_jsx("div", { className: cn('absolute inset-y-0 left-0 w-1 cursor-ew-resize z-10', 'hover:bg-fm-gold/50 transition-colors', isResizing && 'bg-fm-gold'), onMouseDown: handleResizeStart, title: t('toolbar.dragToResize') })), _jsx("div", { className: 'absolute bottom-0 right-full h-full bg-black/80 backdrop-blur-md border-l border-white/20 transition-all duration-300', style: {
                    width: isTabHovered ? (isOpen ? '0px' : '6px') : '2px',
                } }), topGroups.length > 0 && (_jsx("div", { className: 'absolute top-0 right-full flex flex-col pl-1 transition-all duration-300', style: {
                    transform: `translateX(${isTabHovered ? (isOpen ? '2px' : '-4px') : '0px'})`,
                    marginRight: '2px',
                    marginTop: '80px',
                }, onMouseEnter: () => setIsTabHovered(true), onMouseLeave: () => setIsTabHovered(false), children: topGroups.map((group, groupIndex) => {
                    const shouldShowLabel = topGroups.length >= 2;
                    const groupLabel = group.tabs[0]?.groupLabel;
                    return (_jsxs(React.Fragment, { children: [groupIndex > 0 && (_jsx("div", { className: 'my-3 h-[1px] bg-white/10 w-full' })), _jsxs("div", { className: 'relative flex flex-col gap-2', onMouseEnter: () => handleGroupMouseEnter(group.group), onMouseLeave: handleGroupMouseLeave, children: [shouldShowLabel && groupLabel && (_jsxs("div", { className: cn('absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[52px] flex items-center transition-opacity duration-300', showGroupLabel === group.group
                                            ? 'opacity-100'
                                            : 'opacity-0 pointer-events-none'), children: [_jsx("span", { className: 'text-[9px] text-white/50 whitespace-nowrap font-light tracking-wide uppercase', style: {
                                                    writingMode: 'vertical-rl',
                                                    transform: 'rotate(180deg)',
                                                }, children: groupLabel }), _jsxs("div", { className: 'flex flex-col items-center justify-center ml-1.5', style: { height: '100%' }, children: [_jsx("div", { className: 'w-1.5 h-1.5 border-r border-t border-white/20 rounded-tr-sm', style: { borderWidth: '0.5px' } }), _jsx("div", { className: 'flex-1 bg-white/20', style: { width: '0.5px', minHeight: '20px' } }), _jsx("div", { className: 'w-1.5 h-1.5 border-r border-b border-white/20 rounded-br-sm', style: { borderWidth: '0.5px' } })] })] })), group.tabs.map(tab => (_jsx(FmCommonTab, { icon: tab.icon, label: tab.label, isActive: activeTab === tab.id, onClick: () => {
                                            if (!isDragging) {
                                                handleTabClick(tab.id);
                                            }
                                        }, variant: 'vertical' }, tab.id)))] })] }, group.group));
                }) })), bottomGroups.length > 0 && (_jsx("div", { ref: tabsContainerRef, className: 'absolute bottom-0 right-full flex flex-col pl-1 transition-all duration-300', style: {
                    transform: `translateY(${dragOffset}px) translateX(${isTabHovered ? (isOpen ? '2px' : '-4px') : '0px'})`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    marginRight: '2px',
                    marginBottom: `${anchorOffset}px`,
                }, onMouseDown: handleMouseDown, onMouseEnter: () => setIsTabHovered(true), onMouseLeave: () => setIsTabHovered(false), children: bottomGroups.map((group, groupIndex) => {
                    const shouldShowLabel = bottomGroups.length >= 2;
                    const groupLabel = group.tabs[0]?.groupLabel;
                    return (_jsxs(React.Fragment, { children: [groupIndex > 0 && (_jsx("div", { className: 'my-3 h-[1px] bg-white/10 w-full' })), _jsxs("div", { className: 'relative flex flex-col gap-2', onMouseEnter: () => handleGroupMouseEnter(group.group), onMouseLeave: handleGroupMouseLeave, children: [shouldShowLabel && groupLabel && (_jsxs("div", { className: cn('absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[52px] flex items-center transition-opacity duration-300', showGroupLabel === group.group
                                            ? 'opacity-100'
                                            : 'opacity-0 pointer-events-none'), children: [_jsx("span", { className: 'text-[9px] text-white/50 whitespace-nowrap font-light tracking-wide uppercase', style: {
                                                    writingMode: 'vertical-rl',
                                                    transform: 'rotate(180deg)',
                                                }, children: groupLabel }), _jsxs("div", { className: 'flex flex-col items-center justify-center ml-1.5', style: { height: '100%' }, children: [_jsx("div", { className: 'w-1.5 h-1.5 border-r border-t border-white/20 rounded-tr-sm', style: { borderWidth: '0.5px' } }), _jsx("div", { className: 'flex-1 bg-white/20', style: { width: '0.5px', minHeight: '20px' } }), _jsx("div", { className: 'w-1.5 h-1.5 border-r border-b border-white/20 rounded-br-sm', style: { borderWidth: '0.5px' } })] })] })), group.tabs.map(tab => (_jsx(FmCommonTab, { icon: tab.icon, label: tab.label, isActive: activeTab === tab.id, onClick: () => {
                                            if (!isDragging) {
                                                handleTabClick(tab.id);
                                            }
                                        }, variant: 'vertical' }, tab.id)))] })] }, group.group));
                }) })), _jsx("div", { className: cn('h-screen bg-black/90 backdrop-blur-md border-l border-white/20 transition-opacity duration-300 ease-in-out pointer-events-auto', isOpen ? 'opacity-100' : 'opacity-0 w-0'), style: {
                    width: isOpen ? `${drawerWidth}px` : '0px',
                }, children: isOpen && (_jsxs("div", { className: 'pointer-events-auto h-full flex flex-col', children: [_jsxs("div", { className: 'sticky top-0 z-10 bg-black/90 backdrop-blur-md pt-8 px-6 pb-4 border-b border-white/10', children: [_jsx(Button, { variant: 'ghost', size: 'icon', onClick: () => setIsOpen(false), className: 'absolute top-4 right-4 h-8 w-8 text-white/50 hover:text-white hover:bg-white/10', children: _jsx(X, { className: 'h-4 w-4' }) }), activeTabData && (_jsx("h2", { className: 'font-canela text-2xl text-white', children: activeTabData.title || activeTabData.label }))] }), activeTabData && (_jsx("div", { className: 'flex-1 overflow-y-auto px-6 py-4', children: _jsx("div", { className: 'space-y-6', children: activeTabData.content }) })), activeTabData?.footer && (_jsx("div", { className: 'sticky bottom-0 bg-black/90 backdrop-blur-md px-6 py-4 border-t border-white/10', children: activeTabData.footer }))] })) })] }));
};
