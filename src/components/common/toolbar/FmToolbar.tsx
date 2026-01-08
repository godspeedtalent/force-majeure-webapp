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
  X,
  Building2,
  Scan,
  UserCog,
  Info,
  Inbox,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Wrench,
  Settings2,
  Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { cn, useLocalStorage } from '@/shared';
import { FmCommonTab } from '@/components/common/data/FmCommonTab';
import { Button } from '@/components/common/shadcn/button';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared';
import { useShoppingCart } from '@/shared';
import { useFeatureFlagHelpers } from '@/shared/hooks/useFeatureFlags';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';
import { useFmToolbarSafe } from '@/shared/contexts/FmToolbarContext';
import { supabase } from '@/integrations/supabase/client';

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
  maxWidth?: number; // Max width in pixels, defaults to 80vw
  badge?: number; // Badge count to display on the tab icon
}

// Group icons mapping - distinct icons for each group
const GROUP_ICONS: Record<string, LucideIcon> = {
  organization: Building2,
  devTools: Wrench,
  dataConfig: Settings2,
  admin: Shield,
};

// Animation states for group collapse/expand
type AnimationState = 'idle' | 'collapsing' | 'expanding';

// Collapsed group tab component - shows stacked tabs appearance
interface CollapsedGroupTabProps {
  groupName: string;
  tabs: ToolbarTab[];
  groupLabel?: string;
  activeTab: string | null;
  isDragging: boolean;
  toggleGroupCollapsed: (groupName: string) => void;
  clickToExpandText: string;
}

const CollapsedGroupTab = ({
  groupName,
  tabs,
  groupLabel,
  activeTab,
  isDragging,
  toggleGroupCollapsed,
  clickToExpandText,
}: CollapsedGroupTabProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const GroupIcon = GROUP_ICONS[groupName] || tabs[0]?.icon;
  const hasActiveTab = tabs.some(tab => activeTab === tab.id);

  // Number of "stacked" layers to show (max 2 for visual clarity)
  const stackLayers = Math.min(tabs.length - 1, 2);

  return (
    <div
      className='relative'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Stacked tab layers behind the main tab */}
      {Array.from({ length: stackLayers }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'absolute w-12 h-12',
            'bg-black/40 backdrop-blur-sm border border-white/10',
            'transition-all duration-200',
            hasActiveTab && 'border-fm-gold/20'
          )}
          style={{
            // Stack offset: each layer is offset down and right
            bottom: `-${(i + 1) * 3}px`,
            right: `-${(i + 1) * 3}px`,
            zIndex: -1 - i,
          }}
        />
      ))}

      {/* Main tab - same size as regular tabs */}
      <button
        className={cn(
          'relative flex items-center justify-center',
          'w-12 h-12 bg-black/70 backdrop-blur-md',
          'border border-white/20',
          'hover:border-fm-gold/50 hover:bg-black/80',
          'transition-all duration-300 cursor-pointer',
          hasActiveTab && 'border-fm-gold bg-fm-gold/10'
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (!isDragging) {
            toggleGroupCollapsed(groupName);
          }
        }}
        title={`${groupLabel} (${tabs.length}) - ${clickToExpandText}`}
      >
        {/* Group icon */}
        {GroupIcon && (
          <GroupIcon
            className={cn(
              'h-5 w-5 transition-colors duration-200',
              hasActiveTab ? 'text-fm-gold' : 'text-white',
              isHovered && !hasActiveTab && 'text-white'
            )}
          />
        )}

        {/* Count badge - bottom left, square */}
        <div
          className={cn(
            'absolute -bottom-1 -left-1 flex items-center justify-center',
            'min-w-4 h-4 px-1 text-[9px] font-bold',
            'transition-colors duration-200',
            isHovered
              ? 'bg-black text-white ring-1 ring-white/60'
              : hasActiveTab
                ? 'bg-fm-gold text-black ring-1 ring-fm-gold/50'
                : 'bg-white text-black ring-1 ring-white/20'
          )}
        >
          {tabs.length}
        </div>
      </button>
    </div>
  );
};

// Expanded group with hover-to-show collapse button
interface ExpandedGroupWithCollapseButtonProps {
  group: { group: string; tabs: ToolbarTab[] };
  activeTab: string | null;
  isDragging: boolean;
  handleTabClick: (tabId: string) => void;
  toggleGroupCollapsed: (groupName: string) => void;
  clickToExpandText: string;
}

const ExpandedGroupWithCollapseButton = ({
  group,
  activeTab,
  isDragging,
  handleTabClick,
  toggleGroupCollapsed,
  clickToExpandText,
}: ExpandedGroupWithCollapseButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className='relative flex flex-col gap-2'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {group.tabs.map(tab => (
        <FmCommonTab
          key={tab.id}
          icon={tab.icon}
          label={tab.label}
          isActive={activeTab === tab.id}
          onClick={() => {
            if (!isDragging) {
              handleTabClick(tab.id);
            }
          }}
          variant='vertical'
          badge={tab.badge}
        />
      ))}
      {/* Collapse button at bottom - appears on hover, shorter to avoid dividers */}
      <button
        className={cn(
          'absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center',
          'w-12 h-3 bg-white/5 border border-white/10',
          'hover:bg-white/15 hover:border-fm-gold/50',
          'transition-all duration-300 cursor-pointer z-10',
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (!isDragging) {
            toggleGroupCollapsed(group.group);
          }
        }}
        title={clickToExpandText}
      >
        <ChevronUp className='h-2.5 w-2.5 text-white/50 hover:text-fm-gold transition-colors duration-300' />
      </button>
      {/* Invisible hover extension below the button */}
      <div
        className='absolute -bottom-3 left-0 right-0 h-3'
        style={{ pointerEvents: isHovered ? 'auto' : 'none' }}
      />
    </div>
  );
};

// Animated group tabs wrapper - handles staggered collapse/expand animations
interface AnimatedGroupTabsProps {
  group: { group: string; tabs: ToolbarTab[] };
  collapsed: boolean;
  activeTab: string | null;
  isDragging: boolean;
  toggleGroupCollapsed: (groupName: string) => void;
  clickToExpandText: string;
  handleTabClick: (tabId: string) => void;
}

const AnimatedGroupTabs = ({
  group,
  collapsed,
  activeTab,
  isDragging,
  toggleGroupCollapsed,
  clickToExpandText,
  handleTabClick,
}: AnimatedGroupTabsProps) => {
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [collapseProgress, setCollapseProgress] = useState(collapsed ? 1 : 0);
  const [visibleTabs, setVisibleTabs] = useState<number[]>(
    collapsed ? [] : group.tabs.map((_, i) => i)
  );
  const [showFolder, setShowFolder] = useState(collapsed);
  const prevCollapsedRef = useRef(collapsed);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const groupLabel = group.tabs[0]?.groupLabel;
  const STAGGER_DELAY = 80; // ms between each tab animation

  useEffect(() => {
    // Detect collapse/expand transition
    if (prevCollapsedRef.current !== collapsed) {
      // Clear any pending animation
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      if (collapsed) {
        // Start collapsing animation - all tabs fade and shrink together
        setAnimationState('collapsing');
        setShowFolder(true);
        setCollapseProgress(0);

        // Smoothly animate the collapse progress
        const totalDuration = 250;
        const startTime = Date.now();

        const animateCollapse = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / totalDuration);
          // Ease-out curve
          const eased = 1 - Math.pow(1 - progress, 3);

          setCollapseProgress(eased);

          if (progress < 1) {
            requestAnimationFrame(animateCollapse);
          } else {
            setVisibleTabs([]);
            setAnimationState('idle');
          }
        };

        requestAnimationFrame(animateCollapse);

      } else {
        // Start expanding animation - tabs fly out one by one
        setAnimationState('expanding');
        setVisibleTabs([]);
        setCollapseProgress(1);

        // Animate tabs appearing from first to last
        group.tabs.forEach((_, i) => {
          setTimeout(() => {
            setVisibleTabs(prev => [...prev, i]);
          }, i * STAGGER_DELAY + 50);
        });

        // Hide folder after all tabs are visible
        animationTimeoutRef.current = setTimeout(() => {
          setShowFolder(false);
          setAnimationState('idle');
          setCollapseProgress(0);
        }, group.tabs.length * STAGGER_DELAY + 200);
      }
    }

    prevCollapsedRef.current = collapsed;

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [collapsed, group.tabs.length]);

  // If fully collapsed (no animation), just show folder
  if (collapsed && animationState === 'idle') {
    return (
      <CollapsedGroupTab
        groupName={group.group}
        tabs={group.tabs}
        groupLabel={groupLabel}
        activeTab={activeTab}
        isDragging={isDragging}
        toggleGroupCollapsed={toggleGroupCollapsed}
        clickToExpandText={clickToExpandText}
      />
    );
  }

  // If fully expanded (no animation), just show tabs with collapse button at bottom
  if (!collapsed && animationState === 'idle') {
    return (
      <ExpandedGroupWithCollapseButton
        group={group}
        activeTab={activeTab}
        isDragging={isDragging}
        handleTabClick={handleTabClick}
        toggleGroupCollapsed={toggleGroupCollapsed}
        clickToExpandText={clickToExpandText}
      />
    );
  }

  const isCollapsing = animationState === 'collapsing';

  // Calculate the height of expanded tabs vs collapsed folder
  // Each tab is 48px (h-12) with 8px gap, folder is 56px (h-14)
  const TAB_HEIGHT = 48;
  const GAP = 8;
  const FOLDER_HEIGHT = 56;
  const expandedHeight = group.tabs.length * TAB_HEIGHT + (group.tabs.length - 1) * GAP;

  // During animation, show both folder and visible tabs
  return (
    <div
      className='relative flex flex-col overflow-hidden'
      style={{
        // Animate height during collapse/expand for smooth layout transition
        height: isCollapsing
          ? `${FOLDER_HEIGHT + (expandedHeight - FOLDER_HEIGHT) * (1 - collapseProgress)}px`
          : animationState === 'expanding'
            ? `${expandedHeight}px`
            : 'auto',
        transition: isCollapsing ? 'none' : 'height 200ms ease-out',
      }}
    >
      {/* Animated tabs - positioned at top */}
      <div
        className='flex flex-col gap-2 absolute top-0 left-0 right-0'
        style={{
          // During collapse, fade and shrink toward bottom
          opacity: isCollapsing ? 1 - collapseProgress * 1.5 : 1,
          transform: isCollapsing
            ? `scale(${1 - collapseProgress * 0.2})`
            : 'none',
          transformOrigin: 'bottom center',
          pointerEvents: isCollapsing ? 'none' : 'auto',
        }}
      >
        {group.tabs.map((tab, index) => {
          const isVisible = visibleTabs.includes(index);

          // For expanding animation
          if (!isCollapsing) {
            return (
              <div
                key={tab.id}
                className={cn(
                  'transition-all duration-200 ease-out',
                  !isVisible && 'pointer-events-none'
                )}
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? 'translateX(0) scale(1)'
                    : 'translateX(-20px) scale(0.8)',
                }}
              >
                <FmCommonTab
                  icon={tab.icon}
                  label={tab.label}
                  isActive={activeTab === tab.id}
                  onClick={() => {
                    if (!isDragging && isVisible) {
                      handleTabClick(tab.id);
                    }
                  }}
                  variant='vertical'
                  badge={tab.badge}
                />
              </div>
            );
          }

          // For collapsing animation - all tabs visible but fading
          return (
            <div key={tab.id} className='pointer-events-none'>
              <FmCommonTab
                icon={tab.icon}
                label={tab.label}
                isActive={activeTab === tab.id}
                onClick={() => {}}
                variant='vertical'
                badge={tab.badge}
              />
            </div>
          );
        })}
      </div>

      {/* Folder - positioned at bottom of the animated container */}
      {showFolder && (
        <div
          className='absolute bottom-0 left-0'
          style={{
            opacity: isCollapsing ? Math.min(1, collapseProgress * 2) : (visibleTabs.length > 0 ? 0 : 1),
            transform: `scale(${isCollapsing ? 0.8 + collapseProgress * 0.2 : (visibleTabs.length > 0 ? 0.75 : 1)})`,
            transformOrigin: 'bottom left',
            transition: isCollapsing ? 'none' : 'all 200ms ease-out',
            zIndex: 10,
          }}
        >
          <CollapsedGroupTab
            groupName={group.group}
            tabs={group.tabs}
            groupLabel={groupLabel}
            activeTab={activeTab}
            isDragging={isDragging}
            toggleGroupCollapsed={toggleGroupCollapsed}
            clickToExpandText={clickToExpandText}
          />
        </div>
      )}
    </div>
  );
};

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
  const { isFeatureEnabled } = useFeatureFlagHelpers();
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

  // Check if user has items in cart
  const hasCartItems = getTotalItems() > 0;

  // Fetch pending user requests count for admin badge
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchPendingRequestsCount = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count, error } = await (supabase as any)
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
        visible: Boolean(hasOrganizationAccess) && isFeatureEnabled(FEATURE_FLAGS.ORGANIZATION_TOOLS),
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
        visible: Boolean(hasOrganizationAccess) && isFeatureEnabled(FEATURE_FLAGS.ORGANIZATION_TOOLS),
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
      {
        id: 'notes',
        label: t('toolbar.todoNotes'),
        icon: ClipboardList,
        content: <DevNotesTabContent />,
        title: t('toolbar.devNotes'),
        visible: isDeveloperOrAdmin,
        group: 'dataConfig',
        groupOrder: 4,
        alignment: 'bottom',
        groupLabel: t('toolbar.groups.dataConfig'),
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
    [isDeveloperOrAdmin, isAdmin, user, profile, hasOrganizationAccess, navigate, t, isFeatureEnabled, pendingRequestsCount]
  );

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

  const isGroupCollapsed = useCallback((groupName: string) => {
    return collapsedGroups.includes(groupName);
  }, [collapsedGroups]);

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
      {/* Resize Handle - only show for resizable tabs */}
      {isOpen && activeTabData?.resizable && (
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-1 cursor-ew-resize z-10',
            'hover:bg-fm-gold/50 transition-colors',
            isResizing && 'bg-fm-gold'
          )}
          onMouseDown={handleResizeStart}
          title={t('toolbar.dragToResize')}
        />
      )}

      {/* Developer Toolbar Indicator */}
      <div
        className='absolute bottom-0 right-full h-full bg-black/80 backdrop-blur-md border-l border-white/20 transition-all duration-300'
        style={{
          width: isTabHovered ? (isOpen ? '0px' : '6px') : '2px',
        }}
      />

      {/* Top-aligned tabs */}
      {topGroups.length > 0 && (
        <div
          className='absolute top-0 right-full flex flex-col pl-1 transition-all duration-300'
          style={{
            transform: `translateX(${isTabHovered ? (isOpen ? '2px' : '-4px') : '0px'})`,
            marginRight: '2px',
            marginTop: '80px',
          }}
          onMouseEnter={() => setIsTabHovered(true)}
          onMouseLeave={() => setIsTabHovered(false)}
        >
          {topGroups.map((group, groupIndex) => {
            const shouldShowLabel = topGroups.length >= 2;
            const groupLabel = group.tabs[0]?.groupLabel;

            return (
              <React.Fragment key={group.group}>
                {/* Horizontal divider between groups */}
                {groupIndex > 0 && (
                  <div className='my-4 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent w-full' />
                )}
                <div
                  className='relative flex flex-col gap-2'
                  onMouseEnter={() => handleGroupMouseEnter(group.group)}
                  onMouseLeave={handleGroupMouseLeave}
                >
                  {/* Group bracket lines - extend from center of first to center of last item */}
                  {shouldShowLabel && groupLabel && group.tabs.length > 1 && (
                    <>
                      {/* Vertical line connecting items */}
                      <div
                        className={cn(
                          'absolute transition-opacity duration-300',
                          showGroupLabel === group.group
                            ? 'opacity-100'
                            : 'opacity-30'
                        )}
                        style={{
                          left: '-12px',
                          // Start at center of first tab (24px from top)
                          top: '24px',
                          // Height = (number of tabs - 1) * (tab height + gap) = (n-1) * 56px
                          height: `${(group.tabs.length - 1) * 56}px`,
                          width: '1px',
                          background: 'rgba(255, 255, 255, 0.2)',
                        }}
                      />
                      {/* Horizontal tick at first item */}
                      <div
                        className={cn(
                          'absolute transition-opacity duration-300',
                          showGroupLabel === group.group
                            ? 'opacity-100'
                            : 'opacity-30'
                        )}
                        style={{
                          left: '-12px',
                          top: '24px',
                          width: '8px',
                          height: '1px',
                          background: 'rgba(255, 255, 255, 0.2)',
                        }}
                      />
                      {/* Horizontal tick at last item */}
                      <div
                        className={cn(
                          'absolute transition-opacity duration-300',
                          showGroupLabel === group.group
                            ? 'opacity-100'
                            : 'opacity-30'
                        )}
                        style={{
                          left: '-12px',
                          // Last item center = first center + (n-1) * 56
                          top: `${24 + (group.tabs.length - 1) * 56}px`,
                          width: '8px',
                          height: '1px',
                          background: 'rgba(255, 255, 255, 0.2)',
                        }}
                      />
                    </>
                  )}

                  {/* Group label - vertical text */}
                  {shouldShowLabel && groupLabel && (
                    <div
                      className={cn(
                        'absolute transition-opacity duration-300',
                        showGroupLabel === group.group
                          ? 'opacity-100'
                          : 'opacity-0 pointer-events-none'
                      )}
                      style={{
                        left: '-52px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      <span
                        className='text-[9px] text-white/50 whitespace-nowrap font-light tracking-wide uppercase'
                        style={{
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                        }}
                      >
                        {groupLabel}
                      </span>
                    </div>
                  )}

                  {group.tabs.map(tab => (
                    <FmCommonTab
                      key={tab.id}
                      icon={tab.icon}
                      label={tab.label}
                      isActive={activeTab === tab.id}
                      onClick={() => {
                        if (!isDragging) {
                          handleTabClick(tab.id);
                        }
                      }}
                      variant='vertical'
                      badge={tab.badge}
                    />
                  ))}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Bottom-aligned tabs */}
      {bottomGroups.length > 0 && (
        <div
          ref={tabsContainerRef}
          className='absolute bottom-0 right-full flex flex-col pl-1 transition-all duration-300'
          style={{
            transform: `translateY(${dragOffset}px) translateX(${isTabHovered ? (isOpen ? '2px' : '-4px') : '0px'})`,
            cursor: isDragging ? 'grabbing' : 'grab',
            marginRight: '2px',
            marginBottom: `${anchorOffset}px`,
          }}
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setIsTabHovered(true)}
          onMouseLeave={() => setIsTabHovered(false)}
        >
          {bottomGroups.map((group, groupIndex) => {
            const shouldShowLabel = bottomGroups.length >= 2 || group.tabs.length > 1;
            const groupLabel = group.tabs[0]?.groupLabel;
            const collapsed = isGroupCollapsed(group.group);

            return (
              <React.Fragment key={group.group}>
                {/* Horizontal divider between groups */}
                {groupIndex > 0 && (
                  <div className='my-4 h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent w-full' />
                )}
                <div
                  className='relative flex flex-col gap-2'
                  onMouseEnter={() => handleGroupMouseEnter(group.group)}
                  onMouseLeave={handleGroupMouseLeave}
                >
                  {/* Invisible hover extension - fills gaps and extends to collapse bar area */}
                  {shouldShowLabel && groupLabel && !collapsed && group.tabs.length > 1 && (
                    <div
                      className='absolute inset-0 z-0'
                      style={{
                        // Extend beyond the container to cover collapse bar and label areas
                        top: '-20px',
                        left: '-60px',
                        right: '-4px',
                        bottom: '-4px',
                      }}
                    />
                  )}
                  {/* Group bracket lines - extend from center of first to center of last item */}
                  {shouldShowLabel && groupLabel && !collapsed && group.tabs.length > 1 && (
                    <>
                      {/* Vertical line connecting items */}
                      <div
                        className={cn(
                          'absolute transition-opacity duration-300',
                          showGroupLabel === group.group
                            ? 'opacity-100'
                            : 'opacity-30'
                        )}
                        style={{
                          left: '-12px',
                          // Start at center of first tab (24px from top)
                          top: '24px',
                          // Height = (number of tabs - 1) * (tab height + gap) = (n-1) * 56px
                          height: `${(group.tabs.length - 1) * 56}px`,
                          width: '1px',
                          background: 'rgba(255, 255, 255, 0.2)',
                        }}
                      />
                      {/* Horizontal tick at first item */}
                      <div
                        className={cn(
                          'absolute transition-opacity duration-300',
                          showGroupLabel === group.group
                            ? 'opacity-100'
                            : 'opacity-30'
                        )}
                        style={{
                          left: '-12px',
                          top: '24px',
                          width: '8px',
                          height: '1px',
                          background: 'rgba(255, 255, 255, 0.2)',
                        }}
                      />
                      {/* Horizontal tick at last item */}
                      <div
                        className={cn(
                          'absolute transition-opacity duration-300',
                          showGroupLabel === group.group
                            ? 'opacity-100'
                            : 'opacity-30'
                        )}
                        style={{
                          left: '-12px',
                          // Last item center = first center + (n-1) * 56
                          top: `${24 + (group.tabs.length - 1) * 56}px`,
                          width: '8px',
                          height: '1px',
                          background: 'rgba(255, 255, 255, 0.2)',
                        }}
                      />
                    </>
                  )}

                  {/* Collapse bar - appears on hover at the top of the group, shorter to avoid dividers */}
                  {shouldShowLabel && groupLabel && !collapsed && group.tabs.length > 1 && (
                    <button
                      className={cn(
                        'absolute -top-4 left-1/2 -translate-x-1/2 flex items-center justify-center',
                        'w-12 h-3 bg-white/5 border border-white/10 hover:bg-white/15 hover:border-fm-gold/50',
                        'transition-all duration-300 cursor-pointer z-10',
                        showGroupLabel === group.group
                          ? 'opacity-100'
                          : 'opacity-0 pointer-events-none'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroupCollapsed(group.group);
                      }}
                      title={t('toolbar.collapseGroup')}
                    >
                      <ChevronDown className='h-2.5 w-2.5 text-white/50 hover:text-fm-gold' />
                    </button>
                  )}

                  {/* Group label - vertical text */}
                  {shouldShowLabel && groupLabel && !collapsed && (
                    <div
                      className={cn(
                        'absolute transition-opacity duration-300',
                        showGroupLabel === group.group
                          ? 'opacity-100'
                          : 'opacity-0 pointer-events-none'
                      )}
                      style={{
                        left: '-52px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      <span
                        className='text-[9px] text-white/50 whitespace-nowrap font-light tracking-wide uppercase cursor-pointer hover:text-fm-gold transition-colors'
                        style={{
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroupCollapsed(group.group);
                        }}
                      >
                        {groupLabel}
                      </span>
                    </div>
                  )}

                  {/* Tabs - animated collapse/expand */}
                  <AnimatedGroupTabs
                    group={group}
                    collapsed={collapsed}
                    activeTab={activeTab}
                    isDragging={isDragging}
                    toggleGroupCollapsed={toggleGroupCollapsed}
                    clickToExpandText={t('toolbar.clickToExpand')}
                    handleTabClick={handleTabClick}
                  />
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      <div
        className={cn(
          'h-screen bg-black/90 backdrop-blur-md border-l border-white/20 transition-opacity duration-300 ease-in-out pointer-events-auto',
          isOpen ? 'opacity-100' : 'opacity-0 w-0'
        )}
        style={{
          width: isOpen ? `${drawerWidth}px` : '0px',
        }}
      >
        {isOpen && (
          <div className='pointer-events-auto h-full flex flex-col'>
            {/* Sticky Header */}
            <div className='sticky top-0 z-10 bg-black/90 backdrop-blur-md pt-8 px-6 pb-4 border-b border-white/10'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsOpen(false)}
                className='absolute top-4 right-4 h-8 w-8 text-white/50 hover:text-white hover:bg-white/10'
              >
                <X className='h-4 w-4' />
              </Button>

              {activeTabData && (
                <h2 className='font-canela text-2xl text-white'>
                  {activeTabData.title || activeTabData.label}
                </h2>
              )}
            </div>

            {/* Scrollable Content */}
            {activeTabData && (
              <div className='flex-1 overflow-y-auto px-6 py-4'>
                <div className='space-y-6'>{activeTabData.content}</div>
              </div>
            )}

            {/* Sticky Footer */}
            {activeTabData?.footer && (
              <div className='sticky bottom-0 bg-black/90 backdrop-blur-md px-6 py-4 border-t border-white/10'>
                {activeTabData.footer}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
