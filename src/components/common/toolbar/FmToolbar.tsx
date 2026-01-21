import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Database,
  Compass,
  ShoppingCart,
  ToggleLeft,
  ClipboardList,
  LucideIcon,
  Building2,
  Scan,
  UserCog,
  Info,
  Inbox,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { cn, useLocalStorage } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared';
import { useShoppingCart } from '@/shared';
import { useFmToolbarSafe } from '@/shared/contexts/FmToolbarContext';
import { supabase } from '@/shared';

// Import extracted components
import { TopTabGroups, BottomTabGroups, ToolbarDrawer } from './components';

// Toolbar constants
const TOOLBAR_STORAGE_KEY = 'fm-toolbar-width';
const DEFAULT_DRAWER_WIDTH = 384;
const MIN_DRAWER_WIDTH = 320;

// Import tab components
import { CartTabContent } from './tabs/CartTab';
import { OrgDashboardTabContent, ScanTicketsTabContent } from './tabs/OrganizationTab';
import { DatabaseTabContent, DatabaseTabFooter } from './tabs/DatabaseTab';
import { FeatureTogglesTabContent } from './tabs/FeatureTogglesTab';
import { DevNotesTabContent } from './tabs/DevNotesTab';
import { DevNavigationTabContent } from './tabs/DevNavigationTab';
import { MockRoleTabContent } from './tabs/MockRoleTab';
import { PageInfoTabContent, PageInfoTabFooter } from './tabs/PageInfoTab';
import { AdminMessagesTabContent } from './tabs/AdminMessagesTab';
import { ErrorLogTabContent, ErrorLogTabFooter } from './tabs/ErrorLogTab';

export interface ToolbarTab {
  id: string;
  label: string;
  icon: LucideIcon;
  content: ReactNode;
  footer?: ReactNode;
  title?: string;
  visible?: boolean;
  group?: string;
  groupOrder?: number;
  alignment?: 'top' | 'bottom';
  groupLabel?: string;
  groupIcon?: LucideIcon;
  resizable?: boolean;
  maxWidth?: number;
  badge?: number;
}

interface FmToolbarProps {
  className?: string;
  anchorOffset?: number;
}

export const FmToolbar = ({ className, anchorOffset = 96 }: FmToolbarProps) => {
  const { t } = useTranslation('common');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [drawerWidth, setDrawerWidth] = useLocalStorage(TOOLBAR_STORAGE_KEY, DEFAULT_DRAWER_WIDTH);
  const [isTabHovered, setIsTabHovered] = useState(false);
  const [showGroupLabel, setShowGroupLabel] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useLocalStorage<string[]>('fm-toolbar-collapsed-groups', []);
  const [hiddenTabs, setHiddenTabs] = useLocalStorage<string[]>('fm-toolbar-hidden-tabs', []);

  // Use context for state if available, otherwise use local state
  const toolbarContext = useFmToolbarSafe();
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const [localActiveTab, setLocalActiveTab] = useState<string | null>(null);

  // Sync context state with local state (context takes precedence)
  const isOpen = toolbarContext.isOpen || localIsOpen;
  const activeTab = toolbarContext.activeTab || localActiveTab;

  const setIsOpen = useCallback((open: boolean) => {
    setLocalIsOpen(open);
    toolbarContext.setIsOpen(open);
  }, [toolbarContext]);

  const setActiveTab = useCallback((tab: string | null) => {
    setLocalActiveTab(tab);
    toolbarContext.setActiveTab(tab);
  }, [toolbarContext]);

  const { user, profile } = useAuth();
  const { hasAnyRole } = useUserPermissions();
  const { getTotalItems } = useShoppingCart();
  const navigate = useNavigate();

  const startYRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const initialOffsetRef = useRef<number>(0);
  const initialWidthRef = useRef<number>(384);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const dragStartTimeRef = useRef<number>(0);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the constant defined at module level

  // Check if user has actual developer or admin role
  const isDeveloperOrAdmin = hasAnyRole(ROLES.DEVELOPER, ROLES.ADMIN);
  const isAdmin = hasAnyRole(ROLES.ADMIN);
  // Staff can access staff tools (Staff Notes) plus the toolbar itself
  const canAccessStaffTools = hasAnyRole(ROLES.FM_STAFF, ROLES.DEVELOPER, ROLES.ADMIN);

  // Check if user has items in cart
  const hasCartItems = getTotalItems() > 0;

  // Fetch pending user requests count for admin badge
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchPendingRequestsCount = async () => {
      try {
        const { count, error } = await supabase
          .from('user_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        if (!error && count !== null) {
          setPendingRequestsCount(count);
        }
      } catch {
        // Silently fail - badge is not critical
      }
    };

    fetchPendingRequestsCount();

    // Set up polling to refresh count every 60 seconds
    const interval = setInterval(fetchPendingRequestsCount, 60000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Check if user has organization access
  // Admins/Developers always have access, org staff need organization_id
  const hasOrganizationAccess =
    hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER) ||
    (profile?.organization_id &&
      hasAnyRole(ROLES.ORG_ADMIN, ROLES.ORG_STAFF));

  // Helper to navigate and close drawer
  const handleNavigate = useCallback((path: string) => {
    setIsOpen(false);
    setActiveTab(null);
    navigate(path);
  }, [navigate]);

  // Define all tabs based on user roles/permissions
  const tabs: ToolbarTab[] = useMemo(
    () => [
      {
        id: 'cart',
        label: t('toolbar.shoppingCart'),
        icon: ShoppingCart,
        content: <CartTabContent />,
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
        content: <OrgDashboardTabContent onNavigate={handleNavigate} />,
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
        content: <ScanTicketsTabContent onNavigate={handleNavigate} />,
        title: t('toolbar.scanTickets'),
        visible: Boolean(hasOrganizationAccess),
        group: 'organization',
        groupOrder: 2,
        alignment: 'top',
        groupLabel: t('toolbar.groups.organization'),
      },
      // Dev Tools group - navigation and inspection tools
      {
        id: 'tools',
        label: t('toolbar.devNavigation'),
        icon: Compass,
        content: <DevNavigationTabContent onNavigate={handleNavigate} isAdmin={isAdmin} />,
        title: t('toolbar.devNavigation'),
        visible: isDeveloperOrAdmin,
        group: 'devTools',
        groupOrder: 3,
        alignment: 'bottom',
        groupLabel: t('toolbar.groups.devTools'),
      },
      {
        id: 'page-info',
        label: t('toolbar.pageInfo'),
        icon: Info,
        content: <PageInfoTabContent />,
        footer: <PageInfoTabFooter />,
        title: t('toolbar.pageInfoTitle'),
        visible: isDeveloperOrAdmin,
        group: 'devTools',
        groupOrder: 3,
        alignment: 'bottom',
        groupLabel: t('toolbar.groups.devTools'),
      },
      {
        id: 'mock-role',
        label: t('toolbar.mockRole'),
        icon: UserCog,
        content: <MockRoleTabContent />,
        title: t('toolbar.mockRoleSimulator'),
        visible: isDeveloperOrAdmin,
        group: 'devTools',
        groupOrder: 3,
        alignment: 'bottom',
        groupLabel: t('toolbar.groups.devTools'),
      },
      // Data & Config group - data management and configuration tools
      {
        id: 'database',
        label: t('toolbar.database'),
        icon: Database,
        content: <DatabaseTabContent />,
        footer: <DatabaseTabFooter onNavigate={handleNavigate} />,
        title: t('toolbar.databaseManager'),
        visible: isDeveloperOrAdmin,
        group: 'dataConfig',
        groupOrder: 4,
        alignment: 'bottom',
        groupLabel: t('toolbar.groups.dataConfig'),
        resizable: true,
      },
      {
        id: 'features',
        label: t('toolbar.featureToggles'),
        icon: ToggleLeft,
        content: <FeatureTogglesTabContent />,
        title: t('toolbar.featureToggles'),
        visible: isDeveloperOrAdmin,
        group: 'dataConfig',
        groupOrder: 4,
        alignment: 'bottom',
        groupLabel: t('toolbar.groups.dataConfig'),
      },
      // Staff Tools group - accessible to FM_STAFF, DEVELOPER, and ADMIN
      {
        id: 'notes',
        label: t('toolbar.staffNotes'),
        icon: ClipboardList,
        content: <DevNotesTabContent />,
        title: t('toolbar.staffNotesTitle'),
        visible: canAccessStaffTools,
        group: 'staff',
        groupOrder: 2.5, // Between organization (2) and devTools (3)
        alignment: 'bottom',
        groupLabel: t('toolbar.groups.staff'),
        resizable: true,
        maxWidth: Math.floor(window.innerWidth * 0.4), // 40vw
      },
      {
        id: 'error-logs',
        label: t('toolbar.errorLogs'),
        icon: AlertTriangle,
        content: <ErrorLogTabContent />,
        footer: <ErrorLogTabFooter />,
        title: t('toolbar.errorLogsTitle'),
        visible: isDeveloperOrAdmin,
        group: 'dataConfig',
        groupOrder: 4,
        alignment: 'bottom',
        groupLabel: t('toolbar.groups.dataConfig'),
      },
      {
        id: 'admin-messages',
        label: t('toolbar.adminMessages'),
        icon: Inbox,
        content: <AdminMessagesTabContent />,
        title: t('toolbar.adminMessagesTitle'),
        visible: isAdmin,
        group: 'admin',
        groupOrder: 1,
        alignment: 'top',
        groupLabel: t('toolbar.groups.admin'),
        badge: pendingRequestsCount,
      },
    ],
    [isDeveloperOrAdmin, isAdmin, canAccessStaffTools, user, profile, hasOrganizationAccess, navigate, t, pendingRequestsCount, hasCartItems]
  );

  const visibleTabs = useMemo(() => {
    const filtered = tabs.filter(tab => tab.visible !== false && !hiddenTabs.includes(tab.id));
    // Sort by groupOrder first, then by order in array
    return filtered.sort((a, b) => {
      const orderA = a.groupOrder ?? 999;
      const orderB = b.groupOrder ?? 999;
      return orderA - orderB;
    });
  }, [tabs, hiddenTabs]);

  // Get hidden tabs data for display in the indicator
  const hiddenTabsData = useMemo(() => {
    return tabs.filter(tab => tab.visible !== false && hiddenTabs.includes(tab.id));
  }, [tabs, hiddenTabs]);

  // Hide/show tab callbacks
  const hideTab = useCallback((tabId: string) => {
    setHiddenTabs(prev => {
      if (prev.includes(tabId)) return prev;
      return [...prev, tabId];
    });
  }, [setHiddenTabs]);

  const showTab = useCallback((tabId: string) => {
    setHiddenTabs(prev => prev.filter(id => id !== tabId));
  }, [setHiddenTabs]);

  const showAllHiddenTabs = useCallback(() => {
    setHiddenTabs([]);
  }, [setHiddenTabs]);

  // Group tabs by their alignment and group property for rendering
  const { topGroups, bottomGroups } = useMemo(() => {
    const topTabs = visibleTabs.filter(tab => tab.alignment === 'top');
    const bottomTabs = visibleTabs.filter(tab => tab.alignment !== 'top');

    const createGroups = (tabs: ToolbarTab[]) => {
      const groups: { group: string; tabs: ToolbarTab[] }[] = [];
      let currentGroup: string | undefined;
      let currentTabs: ToolbarTab[] = [];

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

  const activeTabData = useMemo(
    () => visibleTabs.find(tab => tab.id === activeTab),
    [visibleTabs, activeTab]
  );

  // Calculate max width based on active tab or default to 80vw
  const getMaxWidth = useCallback(() => {
    if (activeTabData?.maxWidth !== undefined) {
      return activeTabData.maxWidth;
    }
    // Default max width is 80vw
    return Math.floor(window.innerWidth * 0.8);
  }, [activeTabData]);

  const handleTabClick = (tabId: string) => {
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
    if (newTab && !newTab.resizable && drawerWidth > DEFAULT_DRAWER_WIDTH) {
      setDrawerWidth(DEFAULT_DRAWER_WIDTH);
    }
  };

  const handleGroupMouseEnter = (groupName: string) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Show immediately on hover
    setShowGroupLabel(groupName);
  };

  const toggleGroupCollapsed = useCallback((groupName: string) => {
    setCollapsedGroups(prev => {
      if (prev.includes(groupName)) {
        return prev.filter(g => g !== groupName);
      }
      return [...prev, groupName];
    });
  }, [setCollapsedGroups]);

  const handleGroupMouseLeave = () => {
    // Clear any pending timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Hide immediately on mouse leave
    setShowGroupLabel(null);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    dragStartTimeRef.current = Date.now();
    startYRef.current = event.clientY;
    initialOffsetRef.current = dragOffset;
    setIsDragging(true);
  };

  const handleResizeStart = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    startXRef.current = event.clientX;
    initialWidthRef.current = drawerWidth;
    setIsResizing(true);
  };

  const handleResizeMove = useCallback(
    (event: MouseEvent) => {
      const deltaX = startXRef.current - event.clientX; // Reversed: dragging left increases width
      const maxWidth = getMaxWidth();
      const newWidth = Math.max(
        MIN_DRAWER_WIDTH,
        Math.min(maxWidth, initialWidthRef.current + deltaX)
      );
      setDrawerWidth(newWidth);
    },
    [getMaxWidth, setDrawerWidth]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    // localStorage is handled by useLocalStorage hook
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!tabsContainerRef.current) return;

      const deltaY = event.clientY - startYRef.current;
      const containerHeight = tabsContainerRef.current.offsetHeight;
      const viewportHeight = window.innerHeight - anchorOffset;

      const maxOffset = 0;
      const minOffset = Math.min(0, -(containerHeight - viewportHeight));

      const nextOffset = Math.max(
        minOffset,
        Math.min(maxOffset, initialOffsetRef.current + deltaY)
      );
      setDragOffset(nextOffset);
    },
    [anchorOffset]
  );

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
    if (
      isOpen &&
      (!activeTab || !visibleTabs.some(tab => tab.id === activeTab))
    ) {
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

  return (
    <div
      className={cn(
        'fixed bottom-0 right-0 z-[100]',
        'hidden md:block',
        !isResizing && 'transition-all duration-300 ease-in-out',
        className
      )}
      style={{
        width: isOpen ? `${drawerWidth}px` : '0px',
      }}
    >
      {/* Developer Toolbar Indicator */}
      <div
        className='absolute bottom-0 right-full h-full bg-black/80 backdrop-blur-md border-l border-white/20 transition-all duration-300'
        style={{
          width: isTabHovered ? (isOpen ? '0px' : '6px') : '2px',
        }}
      />

      {/* Top-aligned tabs */}
      <TopTabGroups
        groups={topGroups}
        activeTab={activeTab}
        isDragging={isDragging}
        isOpen={isOpen}
        isTabHovered={isTabHovered}
        showGroupLabel={showGroupLabel}
        handleTabClick={handleTabClick}
        handleGroupMouseEnter={handleGroupMouseEnter}
        handleGroupMouseLeave={handleGroupMouseLeave}
        setIsTabHovered={setIsTabHovered}
      />

      {/* Bottom-aligned tabs */}
      <BottomTabGroups
        groups={bottomGroups}
        activeTab={activeTab}
        isDragging={isDragging}
        isOpen={isOpen}
        isTabHovered={isTabHovered}
        showGroupLabel={showGroupLabel}
        dragOffset={dragOffset}
        anchorOffset={anchorOffset}
        collapsedGroups={collapsedGroups}
        handleTabClick={handleTabClick}
        handleGroupMouseEnter={handleGroupMouseEnter}
        handleGroupMouseLeave={handleGroupMouseLeave}
        handleMouseDown={handleMouseDown}
        setIsTabHovered={setIsTabHovered}
        toggleGroupCollapsed={toggleGroupCollapsed}
        clickToExpandText={t('toolbar.clickToExpand')}
        collapseGroupText={t('toolbar.collapseGroup')}
        tabsContainerRef={tabsContainerRef}
        hiddenTabs={hiddenTabsData}
        onHideTab={hideTab}
        onShowTab={showTab}
        onShowAllHiddenTabs={showAllHiddenTabs}
        hideTabText={t('toolbar.hideTab')}
        showTabText={t('toolbar.showTab')}
        showAllTabsText={t('toolbar.showAllTabs')}
        hiddenTabsText={t('toolbar.hiddenTabs')}
      />

      {/* Drawer content */}
      <ToolbarDrawer
        isOpen={isOpen}
        isResizing={isResizing}
        drawerWidth={drawerWidth}
        activeTabData={activeTabData}
        onClose={() => setIsOpen(false)}
        onResizeStart={handleResizeStart}
        dragToResizeText={t('toolbar.dragToResize')}
      />
    </div>
  );
};
