/**
 * DeveloperHome - Unified Developer & Admin Dashboard
 *
 * Combines:
 * - Developer Tools (database, docs, demo, testing)
 * - Admin Controls (site settings, ticketing, feature flags)
 * - Dashboards (recording ratings, analytics, activity logs)
 * - Database Navigator (all tables with subgroups)
 *
 * Accessible to users with admin or developer roles.
 */

import { useEffect, useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import {
  FmCommonSideNavGroup,
  FmCommonSideNavItem,
  FmCommonSideNavSubgroup,
} from '@/components/common/navigation/FmCommonSideNav';
import { MobileHorizontalTabs, MobileHorizontalTab } from '@/components/mobile';
import {
  // Developer Tools icons
  Database,
  FileText,
  FlaskConical,
  ClipboardCheck,
  Code,
  // Admin icons
  Shield,
  Sliders,
  DollarSign,
  // Dashboard icons
  BarChart3,
  Star,
  Users,
  LineChart,
  // Activity Logs icons
  Activity,
  UserCircle,
  Ticket,
  Mail,
  RefreshCw,
  Download,
  FileJson,
  FileSpreadsheet,
  // Database icons
  Mic2,
  Calendar,
  MapPin,
  Disc3,
  Building2,
  HardDrive,
  Images,
  MessageSquare,
  UserPlus,
  FileQuestion,
} from 'lucide-react';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES, FEATURE_FLAGS } from '@/shared';
import { useFeatureFlagHelpers } from '@/shared';
import { AdminLockIndicator } from '@/components/common/indicators';
import { PageErrorBoundary } from '@/components/common/feedback';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { formatHeader } from '@/shared';
import { Button } from '@/components/common/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';

// Admin components
import { FeatureToggleSection } from '@/components/DevTools/FeatureToggleSection';
import { AdminTicketingSection } from '@/components/admin/AdminTicketingSection';
import { DevToolsManagement } from '@/components/admin/DevToolsManagement';
import { UserManagement } from '../admin/UserManagement';
import { OrganizationsManagement } from '../admin/OrganizationsManagement';
import { EventsManagement } from '../admin/EventsManagement';
import { ArtistRegistrationsManagement } from '../admin/ArtistRegistrationsManagement';
import { UserRequestsAdmin } from '@/components/admin/UserRequestsAdmin';
import { GalleryManagementSection } from '@/components/DevTools/GalleryManagementSection';

// Database tabs
import {
  DeveloperDatabaseOverviewTab,
  DeveloperDatabaseArtistsTab,
  DeveloperDatabaseVenuesTab,
  DeveloperDatabaseRecordingsTab,
} from './tabs';
import { useDatabaseCounts } from './hooks/useDeveloperDatabaseData';

// Dashboard components
import RecordingRatingsDashboard from './dashboards/RecordingRatingsDashboard';
import { AnalyticsDashboardContent } from './dashboards/AnalyticsDashboardContent';
import { UserMetricsDashboard } from './dashboards/userMetrics';

// Activity Logs components
import { ActivityLogList } from '@/features/activity-logs/components/ActivityLogList';
import { ActivityLogSummary } from '@/features/activity-logs/components/ActivityLogSummary';
import { ActivityLogFilters } from '@/features/activity-logs/components/ActivityLogFilters';
import {
  useActivityLogs,
  useActivitySummary,
  useExportActivityLogs,
  useRefreshActivityLogs,
} from '@/features/activity-logs/hooks/useActivityLogs';
import {
  ActivityLogFilters as LogFilters,
  ActivityCategory,
} from '@/features/activity-logs/types';

// ============================================================================
// Types
// ============================================================================

type DeveloperTab =
  // Developer Tools (external links)
  | 'dev_demo'
  | 'dev_docs'
  | 'dev_ticket_flow'
  // Admin Controls
  | 'admin_settings'
  | 'admin_devtools'
  | 'admin_ticketing'
  // Dashboards
  | 'dash_recordings'
  | 'dash_users'
  | 'dash_analytics'
  // Activity Logs
  | 'logs_all'
  | 'logs_account'
  | 'logs_event'
  | 'logs_ticket'
  | 'logs_contact'
  // Database - Overview
  | 'db_overview'
  // Database - Tables
  | 'db_artists'
  | 'db_events'
  | 'db_recordings'
  | 'db_venues'
  | 'db_organizations'
  | 'db_users'
  // Database - Storage
  | 'db_galleries'
  // Database - Messages
  | 'db_registrations'
  | 'db_user_requests';

const VALID_TABS: DeveloperTab[] = [
  'dev_demo',
  'dev_docs',
  'dev_ticket_flow',
  'admin_settings',
  'admin_devtools',
  'admin_ticketing',
  'dash_recordings',
  'dash_users',
  'dash_analytics',
  'logs_all',
  'logs_account',
  'logs_event',
  'logs_ticket',
  'logs_contact',
  'db_overview',
  'db_artists',
  'db_events',
  'db_recordings',
  'db_venues',
  'db_organizations',
  'db_users',
  'db_galleries',
  'db_registrations',
  'db_user_requests',
];

// External navigation mapping (dash_analytics is now inline)
const EXTERNAL_ROUTES: Partial<Record<DeveloperTab, string>> = {
  dev_demo: '/developer/demo',
  dev_docs: '/developer/documentation',
  dev_ticket_flow: '/developer/ticket-flow',
};

// ============================================================================
// Component
// ============================================================================

export default function DeveloperHome() {
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasRole } = useUserPermissions();
  const isAdmin = hasRole(ROLES.ADMIN);
  const { isFeatureEnabled } = useFeatureFlagHelpers();
  const isRecordingRatingsEnabled = isFeatureEnabled(FEATURE_FLAGS.RECORDING_RATINGS);

  // Get all counts for navigation badges
  const {
    pendingRegistrationsCount,
    pendingUserRequestsCount,
    venuesCount,
    organizationsCount,
    usersCount,
    artistsCount,
    eventsCount,
    recordingsCount,
  } = useDatabaseCounts();

  // Get active tab from URL query string
  const tabFromUrl = searchParams.get('tab') as DeveloperTab | null;
  const activeTab: DeveloperTab =
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'db_overview';

  // Navigation groups configuration
  const navigationGroups: FmCommonSideNavGroup<DeveloperTab>[] = useMemo(() => {
    // Developer Tools group - external links
    const devToolsItems: FmCommonSideNavItem<DeveloperTab>[] = [
      {
        id: 'dev_demo',
        label: t('developerIndex.demoTools'),
        icon: FlaskConical,
        description: t('developerIndex.demoToolsDescription'),
        isExternal: true,
      },
      {
        id: 'dev_docs',
        label: t('developerIndex.documentationViewer'),
        icon: FileText,
        description: t('developerIndex.documentationViewerDescription'),
        isExternal: true,
      },
      {
        id: 'dev_ticket_flow',
        label: t('developerIndex.ticketFlowTests'),
        icon: ClipboardCheck,
        description: t('developerIndex.ticketFlowTestsDescription'),
        isExternal: true,
      },
    ];

    // Admin Controls group
    const adminControlsItems: FmCommonSideNavItem<DeveloperTab>[] = [
      {
        id: 'admin_settings',
        label: 'Feature Flags',
        icon: Sliders,
        description: 'Toggle feature flags and site settings',
      },
      {
        id: 'admin_devtools',
        label: 'Developer Tools',
        icon: Code,
        description: 'Toggle dev environment features',
      },
      {
        id: 'admin_ticketing',
        label: 'Ticketing',
        icon: DollarSign,
        description: 'Configure ticketing fees and checkout behavior',
      },
    ];

    // Dashboards group - conditionally include Recording Ratings based on feature flag
    const dashboardItems: FmCommonSideNavItem<DeveloperTab>[] = [
      ...(isRecordingRatingsEnabled
        ? [
            {
              id: 'dash_recordings' as DeveloperTab,
              label: 'Recording Ratings',
              icon: Star,
              description: 'Rate and analyze artist recordings',
            },
          ]
        : []),
      {
        id: 'dash_users',
        label: 'User Metrics',
        icon: Users,
        description: 'User engagement analytics',
      },
      {
        id: 'dash_analytics',
        label: 'Site Analytics',
        icon: LineChart,
        description: 'Comprehensive site analytics',
      },
    ];

    // Activity Logs group
    const activityLogsItems: FmCommonSideNavItem<DeveloperTab>[] = [
      {
        id: 'logs_all',
        label: t('activityLogsPage.allLogs'),
        icon: Activity,
        description: t('activityLogsPage.allLogsDescription'),
      },
      {
        id: 'logs_account',
        label: t('activityLogsPage.accountActivity'),
        icon: UserCircle,
        description: t('activityLogsPage.accountActivityDescription'),
      },
      {
        id: 'logs_event',
        label: t('activityLogsPage.eventActivity'),
        icon: Calendar,
        description: t('activityLogsPage.eventActivityDescription'),
      },
      {
        id: 'logs_ticket',
        label: t('activityLogsPage.ticketActivity'),
        icon: Ticket,
        description: t('activityLogsPage.ticketActivityDescription'),
      },
      {
        id: 'logs_contact',
        label: t('activityLogsPage.contactActivity'),
        icon: Mail,
        description: t('activityLogsPage.contactActivityDescription'),
      },
    ];

    // Database subgroups
    const dbOverviewSubgroup: FmCommonSideNavSubgroup<DeveloperTab> = {
      label: 'Overview',
      icon: Database,
      items: [
        {
          id: 'db_overview',
          label: 'Dashboard',
          icon: Database,
          description: 'Database overview and search',
        },
      ],
    };

    // Tables - sorted alphabetically
    const tablesItems: Array<FmCommonSideNavItem<DeveloperTab> & { sortKey: string }> = [
      {
        id: 'db_artists',
        label: 'Artists',
        sortKey: 'Artists',
        icon: Mic2,
        description: 'Artist Management',
        badge: <span className="text-[10px] text-muted-foreground">{artistsCount}</span>,
      },
      {
        id: 'db_events',
        label: 'Events',
        sortKey: 'Events',
        icon: Calendar,
        description: 'Event Management',
        badge: <span className="text-[10px] text-muted-foreground">{eventsCount}</span>,
      },
      {
        id: 'db_recordings',
        label: 'Recordings',
        sortKey: 'Recordings',
        icon: Disc3,
        description: 'Music Recordings',
        badge: <span className="text-[10px] text-muted-foreground">{recordingsCount}</span>,
      },
      {
        id: 'db_venues',
        label: 'Venues',
        sortKey: 'Venues',
        icon: MapPin,
        description: 'Venue Management',
        badge: <span className="text-[10px] text-muted-foreground">{venuesCount}</span>,
      },
    ];

    // Add admin-only tables
    if (isAdmin) {
      tablesItems.push(
        {
          id: 'db_organizations',
          label: (
            <span className="flex items-center gap-1.5">
              Organizations
              <AdminLockIndicator position="inline" size="xs" tooltipText="Admin only" />
            </span>
          ),
          sortKey: 'Organizations',
          icon: Building2,
          description: 'Organization Management',
          badge: <span className="text-[10px] text-muted-foreground">{organizationsCount}</span>,
        },
        {
          id: 'db_users',
          label: (
            <span className="flex items-center gap-1.5">
              Users
              <AdminLockIndicator position="inline" size="xs" tooltipText="Admin only" />
            </span>
          ),
          sortKey: 'Users',
          icon: Users,
          description: 'User Management',
          badge: <span className="text-[10px] text-muted-foreground">{usersCount}</span>,
        }
      );
    }

    // Sort alphabetically
    tablesItems.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    const dbTablesSubgroup: FmCommonSideNavSubgroup<DeveloperTab> = {
      label: 'Tables',
      icon: Database,
      items: tablesItems,
    };

    const dbStorageSubgroup: FmCommonSideNavSubgroup<DeveloperTab> = {
      label: 'Storage',
      icon: HardDrive,
      items: [
        {
          id: 'db_galleries',
          label: 'Galleries',
          icon: Images,
          description: 'Media gallery management',
        },
      ],
    };

    // Messages subgroup (admin only)
    const messagesItems: FmCommonSideNavItem<DeveloperTab>[] = [];
    if (isAdmin) {
      messagesItems.push(
        {
          id: 'db_registrations',
          label: t('artistRegistrations.navLabel'),
          icon: UserPlus,
          description: t('artistRegistrations.navDescription'),
          badge:
            pendingRegistrationsCount > 0 ? (
              <span className="px-1.5 py-0.5 text-[10px] bg-fm-gold text-black font-bold">
                {pendingRegistrationsCount}
              </span>
            ) : undefined,
        },
        {
          id: 'db_user_requests',
          label: 'User Requests',
          icon: FileQuestion,
          description: 'Manage user requests',
          badge:
            pendingUserRequestsCount > 0 ? (
              <span className="px-1.5 py-0.5 text-[10px] bg-fm-gold text-black font-bold">
                {pendingUserRequestsCount}
              </span>
            ) : undefined,
        }
      );
    }

    // Build the groups array - Order: Dashboards, Admin, Messages, Storage, Database, Developer, Activity Logs
    const groups: FmCommonSideNavGroup<DeveloperTab>[] = [];

    // 1. Dashboards
    groups.push({
      label: 'Dashboards',
      icon: BarChart3,
      items: dashboardItems,
    });

    // 2. Admin Controls - only show if admin
    if (isAdmin) {
      groups.push({
        label: 'Admin Controls',
        icon: Shield,
        items: adminControlsItems,
        adminOnly: true,
      });
    }

    // 3. Messages (top-level, admin only)
    if (isAdmin && messagesItems.length > 0) {
      groups.push({
        label: 'Messages',
        icon: MessageSquare,
        items: messagesItems,
        adminOnly: true,
      });
    }

    // 4. Storage (top-level)
    groups.push({
      label: 'Storage',
      icon: HardDrive,
      items: dbStorageSubgroup.items,
    });

    // 5. Database with subgroups (just Overview and Tables now)
    const dbSubgroups: FmCommonSideNavSubgroup<DeveloperTab>[] = [
      dbOverviewSubgroup,
      dbTablesSubgroup,
    ];

    groups.push({
      label: 'Database',
      icon: Database,
      subgroups: dbSubgroups,
    });

    // 6. Developer Tools
    groups.push({
      label: 'Developer',
      icon: Code,
      items: devToolsItems,
    });

    // 7. Activity Logs - only show if admin
    if (isAdmin) {
      groups.push({
        label: 'Activity Logs',
        icon: Activity,
        items: activityLogsItems,
        adminOnly: true,
      });
    }

    return groups;
  }, [
    isAdmin,
    isRecordingRatingsEnabled,
    t,
    pendingRegistrationsCount,
    pendingUserRequestsCount,
    artistsCount,
    eventsCount,
    recordingsCount,
    venuesCount,
    organizationsCount,
    usersCount,
  ]);

  // Mobile horizontal tabs configuration
  const mobileTabs: MobileHorizontalTab[] = useMemo(() => {
    const baseTabs: MobileHorizontalTab[] = [
      { id: 'db_overview', label: 'Overview', icon: Database },
      { id: 'db_artists', label: 'Artists', icon: Mic2 },
      { id: 'db_events', label: 'Events', icon: Calendar },
      { id: 'db_recordings', label: 'Tracks', icon: Disc3 },
      { id: 'db_venues', label: 'Venues', icon: MapPin },
      { id: 'dash_recordings', label: 'Ratings', icon: Star },
    ];
    if (isAdmin) {
      baseTabs.push(
        { id: 'admin_settings', label: 'Settings', icon: Sliders },
        { id: 'db_organizations', label: 'Orgs', icon: Building2 },
        { id: 'db_users', label: 'Users', icon: Users }
      );
    }
    return baseTabs;
  }, [isAdmin]);

  // Update URL when tab changes via location state
  useEffect(() => {
    const state = location.state as {
      editEventId?: string;
      editArtistId?: string;
      openTab?: string;
    } | null;

    if (state?.editArtistId) {
      navigate(`?tab=db_artists`, { replace: true });
    } else if (state?.openTab && VALID_TABS.includes(state.openTab as DeveloperTab)) {
      navigate(`?tab=${state.openTab}`, { replace: true });
    }
  }, [location.state, navigate]);

  // Handler to change tabs and update URL
  const handleTabChange = useCallback(
    (tab: DeveloperTab) => {
      // Check if this is an external navigation
      const externalRoute = EXTERNAL_ROUTES[tab];
      if (externalRoute) {
        navigate(externalRoute);
        return;
      }
      navigate(`?tab=${tab}`);
    },
    [navigate]
  );

  // Render tab header for admin/dashboard sections
  const renderTabHeader = (title: string, description?: string) => (
    <div className="mb-[20px]">
      <div className="flex items-center gap-[10px] mb-[20px]">
        <Sliders className="h-6 w-6 text-fm-gold" />
        <h1 className="text-3xl font-canela">{formatHeader(title)}</h1>
      </div>
      {description && (
        <p className="text-muted-foreground text-sm mb-4">{description}</p>
      )}
      <DecorativeDivider marginTop="mt-0" marginBottom="mb-6" lineWidth="w-32" opacity={0.5} />
    </div>
  );

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={handleTabChange}
      showDividers
      mobileHorizontalTabs={
        <MobileHorizontalTabs
          tabs={mobileTabs}
          activeTab={activeTab}
          onTabChange={tab => handleTabChange(tab as DeveloperTab)}
        />
      }
    >
      <div className="max-w-full">
        {/* ======================== ADMIN CONTROLS ======================== */}
        {activeTab === 'admin_settings' && (
          <PageErrorBoundary section="Feature Flags">
            {renderTabHeader('Feature Flags')}
            <div className="space-y-8">
              <div>
                <p className="text-muted-foreground text-sm mb-4">
                  Control feature availability across different environments
                </p>
                <FeatureToggleSection />
              </div>
            </div>
          </PageErrorBoundary>
        )}

        {activeTab === 'admin_devtools' && (
          <PageErrorBoundary section="Developer Tools">
            {renderTabHeader('Developer Tools')}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-canela font-semibold mb-2">
                  {formatHeader('Dev Toolbar Sections')}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Control which sections appear in the developer toolbar for testing
                </p>
                <DevToolsManagement />
              </div>
            </div>
          </PageErrorBoundary>
        )}

        {activeTab === 'admin_ticketing' && (
          <PageErrorBoundary section="Ticketing">
            {renderTabHeader('Ticketing')}
            <div className="space-y-6">
              <div>
                <p className="text-muted-foreground text-sm mb-4">
                  Configure checkout timer and fees applied to all ticket purchases
                </p>
                <AdminTicketingSection />
              </div>
            </div>
          </PageErrorBoundary>
        )}

        {/* ======================== DASHBOARDS ======================== */}
        {activeTab === 'dash_recordings' && (
          <PageErrorBoundary section="Recording Ratings">
            <RecordingRatingsDashboard />
          </PageErrorBoundary>
        )}

        {activeTab === 'dash_users' && (
          <PageErrorBoundary section="User Metrics">
            <UserMetricsDashboard />
          </PageErrorBoundary>
        )}

        {activeTab === 'dash_analytics' && (
          <PageErrorBoundary section="Site Analytics">
            <AnalyticsDashboardContent />
          </PageErrorBoundary>
        )}

        {/* ======================== ACTIVITY LOGS ======================== */}
        {(activeTab === 'logs_all' ||
          activeTab === 'logs_account' ||
          activeTab === 'logs_event' ||
          activeTab === 'logs_ticket' ||
          activeTab === 'logs_contact') && (
          <PageErrorBoundary section="Activity Logs">
            <ActivityLogsContent
              activeTab={activeTab}
              t={t}
            />
          </PageErrorBoundary>
        )}

        {/* ======================== DATABASE ======================== */}
        {activeTab === 'db_overview' && (
          <PageErrorBoundary section="Overview">
            <DeveloperDatabaseOverviewTab />
          </PageErrorBoundary>
        )}

        {activeTab === 'db_artists' && (
          <PageErrorBoundary section="Artists">
            <DeveloperDatabaseArtistsTab />
          </PageErrorBoundary>
        )}

        {activeTab === 'db_venues' && (
          <PageErrorBoundary section="Venues">
            <DeveloperDatabaseVenuesTab />
          </PageErrorBoundary>
        )}

        {activeTab === 'db_recordings' && (
          <PageErrorBoundary section="Recordings">
            <DeveloperDatabaseRecordingsTab />
          </PageErrorBoundary>
        )}

        {activeTab === 'db_events' && (
          <PageErrorBoundary section="Events">
            <EventsManagement />
          </PageErrorBoundary>
        )}

        {activeTab === 'db_organizations' && (
          <PageErrorBoundary section="Organizations">
            <OrganizationsManagement />
          </PageErrorBoundary>
        )}

        {activeTab === 'db_users' && (
          <PageErrorBoundary section="Users">
            <UserManagement />
          </PageErrorBoundary>
        )}

        {activeTab === 'db_galleries' && (
          <PageErrorBoundary section="Galleries">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-canela font-bold text-foreground mb-2">
                  Media Galleries
                </h1>
                <p className="text-muted-foreground">
                  Manage image galleries and media collections for the site.
                </p>
              </div>
              <GalleryManagementSection />
            </div>
          </PageErrorBoundary>
        )}

        {activeTab === 'db_registrations' && (
          <PageErrorBoundary section="Artist Registrations">
            <ArtistRegistrationsManagement />
          </PageErrorBoundary>
        )}

        {activeTab === 'db_user_requests' && (
          <PageErrorBoundary section="User Requests">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-canela font-bold text-foreground mb-2">
                  User Requests
                </h1>
                <p className="text-muted-foreground">
                  Review and manage user requests for artist linking, data deletion, and more.
                </p>
              </div>
              <UserRequestsAdmin />
            </div>
          </PageErrorBoundary>
        )}
      </div>
    </SideNavbarLayout>
  );
}

// ============================================================================
// Activity Logs Content Component
// ============================================================================

interface ActivityLogsContentProps {
  activeTab: DeveloperTab;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function ActivityLogsContent({ activeTab, t }: ActivityLogsContentProps) {
  const [filters, setFilters] = useState<LogFilters>({});
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Map tab to category filter
  const categoryMap: Record<string, ActivityCategory | undefined> = {
    logs_all: undefined,
    logs_account: 'account',
    logs_event: 'event',
    logs_ticket: 'ticket',
    logs_contact: 'contact',
  };

  // Get effective filters based on active tab
  const effectiveFilters: LogFilters = {
    ...filters,
    categories: categoryMap[activeTab] ? [categoryMap[activeTab] as ActivityCategory] : filters.categories,
  };

  // Queries
  const { data: logsData, isLoading: isLoadingLogs } = useActivityLogs(effectiveFilters, page, pageSize);
  const { data: summary = [], isLoading: isLoadingSummary } = useActivitySummary(
    effectiveFilters.dateFrom,
    effectiveFilters.dateTo
  );

  // Mutations
  const exportMutation = useExportActivityLogs();
  const { refreshAll } = useRefreshActivityLogs();

  const handleFiltersChange = useCallback((newFilters: LogFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const handleCategoryClick = useCallback((category: ActivityCategory) => {
    setFilters(prev => ({
      ...prev,
      categories: [category],
    }));
    setPage(1);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (logsData && page < logsData.totalPages) {
      setPage(prev => prev + 1);
    }
  }, [logsData, page]);

  const handleExport = useCallback(
    (format: 'json' | 'csv') => {
      exportMutation.mutate({ filters: effectiveFilters, format });
    },
    [exportMutation, effectiveFilters]
  );

  const allLogs = logsData?.data || [];
  const hasMore = logsData ? page < logsData.totalPages : false;

  // Get title based on active tab
  const getTitle = () => {
    switch (activeTab) {
      case 'logs_account':
        return t('activityLogsPage.accountActivity');
      case 'logs_event':
        return t('activityLogsPage.eventActivity');
      case 'logs_ticket':
        return t('activityLogsPage.ticketActivity');
      case 'logs_contact':
        return t('activityLogsPage.contactActivity');
      default:
        return t('activityLogsPage.title');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <Activity className="h-6 w-6 text-fm-gold" />
            <h1 className="text-3xl font-canela">{formatHeader(getTitle())}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshAll()}
              className="border-white/20 hover:border-fm-gold"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('buttons.refresh')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={exportMutation.isPending}
                  className="border-white/20 hover:border-fm-gold"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('table.export')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 border-white/20">
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <FileJson className="h-4 w-4 mr-2" />
                  {t('activityLogsPage.exportAsJson')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  {t('activityLogsPage.exportAsCsv')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mt-2">
          {t('activityLogsPage.description')}
        </p>
      </div>

      <DecorativeDivider marginTop="mt-0" marginBottom="mb-6" lineWidth="w-32" opacity={0.5} />

      {/* Summary Cards */}
      <ActivityLogSummary
        summary={summary}
        isLoading={isLoadingSummary}
        onCategoryClick={handleCategoryClick}
      />

      {/* Filters */}
      {activeTab === 'logs_all' && (
        <div className="p-4 bg-black/40 border border-white/10">
          <ActivityLogFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
        </div>
      )}

      {/* Results count */}
      {logsData && (
        <div className="text-sm text-muted-foreground">
          {t('activityLogsPage.showingLogs', { showing: allLogs.length, total: logsData.totalCount })}
        </div>
      )}

      {/* Log List */}
      <div className="bg-black/40 border border-white/10">
        <ActivityLogList
          logs={allLogs}
          isLoading={isLoadingLogs}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
        />
      </div>
    </div>
  );
}
