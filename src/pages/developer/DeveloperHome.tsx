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

import { useEffect, useMemo, useCallback } from 'react';
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
  Package,
  ClipboardCheck,
  Code,
  // Admin icons
  Shield,
  Sliders,
  DollarSign,
  Activity,
  // Dashboard icons
  BarChart3,
  Star,
  Users,
  LineChart,
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
import { ROLES } from '@/shared';
import { AdminLockIndicator } from '@/components/common/indicators';
import { PageErrorBoundary } from '@/components/common/feedback';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { formatHeader } from '@/shared';

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

// ============================================================================
// Types
// ============================================================================

type DeveloperTab =
  // Developer Tools (external links)
  | 'dev_demo'
  | 'dev_docs'
  | 'dev_components'
  | 'dev_ticket_flow'
  // Admin Controls
  | 'admin_settings'
  | 'admin_devtools'
  | 'admin_ticketing'
  | 'admin_logs'
  // Dashboards
  | 'dash_recordings'
  | 'dash_activity'
  | 'dash_users'
  | 'dash_analytics'
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
  'dev_components',
  'dev_ticket_flow',
  'admin_settings',
  'admin_devtools',
  'admin_ticketing',
  'admin_logs',
  'dash_recordings',
  'dash_activity',
  'dash_users',
  'dash_analytics',
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

// External navigation mapping
const EXTERNAL_ROUTES: Partial<Record<DeveloperTab, string>> = {
  dev_demo: '/developer/demo',
  dev_docs: '/developer/documentation',
  dev_components: '/developer/components',
  dev_ticket_flow: '/developer/ticket-flow',
  admin_logs: '/admin/logs',
  dash_analytics: '/admin/analytics',
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
        id: 'dev_components',
        label: t('developerIndex.componentsCatalog'),
        icon: Package,
        description: t('developerIndex.componentsCatalogDescription'),
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
        label: 'Site Settings',
        icon: Sliders,
        description: 'Configure feature flags and site settings',
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
      {
        id: 'admin_logs',
        label: 'Activity Logs',
        icon: Activity,
        description: 'View system activity logs',
        isExternal: true,
      },
    ];

    // Dashboards group
    const dashboardItems: FmCommonSideNavItem<DeveloperTab>[] = [
      {
        id: 'dash_recordings',
        label: 'Recording Ratings',
        icon: Star,
        description: 'Rate and analyze artist recordings',
      },
      {
        id: 'dash_activity',
        label: 'Activity Log',
        icon: Activity,
        description: 'View recent system activity',
      },
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
        isExternal: true,
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

    const dbMessagesSubgroup: FmCommonSideNavSubgroup<DeveloperTab> | null =
      messagesItems.length > 0
        ? {
            label: 'Messages',
            icon: MessageSquare,
            items: messagesItems,
          }
        : null;

    // Build the groups array
    const groups: FmCommonSideNavGroup<DeveloperTab>[] = [
      {
        label: 'Developer Tools',
        icon: Code,
        items: devToolsItems,
      },
    ];

    // Admin Controls - only show if admin
    if (isAdmin) {
      groups.push({
        label: 'Admin Controls',
        icon: Shield,
        items: adminControlsItems,
        adminOnly: true,
      });
    }

    // Dashboards
    groups.push({
      label: 'Dashboards',
      icon: BarChart3,
      items: dashboardItems,
    });

    // Database with subgroups
    const dbSubgroups: FmCommonSideNavSubgroup<DeveloperTab>[] = [
      dbOverviewSubgroup,
      dbTablesSubgroup,
      dbStorageSubgroup,
    ];

    if (dbMessagesSubgroup) {
      dbSubgroups.push(dbMessagesSubgroup);
    }

    groups.push({
      label: 'Database',
      icon: Database,
      subgroups: dbSubgroups,
    });

    return groups;
  }, [
    isAdmin,
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

  // Placeholder for future dashboards
  const ComingSoonDashboard = ({ title }: { title: string }) => (
    <div className="flex items-center justify-center h-[400px]">
      <div className="text-center space-y-2">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-medium">{title}</h2>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
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
          <PageErrorBoundary section="Site Settings">
            {renderTabHeader('Site Settings')}
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-canela font-semibold mb-2">
                  {formatHeader('Feature Flags')}
                </h3>
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

        {activeTab === 'dash_activity' && (
          <PageErrorBoundary section="Activity Log">
            <ComingSoonDashboard title="Activity Log" />
          </PageErrorBoundary>
        )}

        {activeTab === 'dash_users' && (
          <PageErrorBoundary section="User Metrics">
            <ComingSoonDashboard title="User Metrics" />
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
