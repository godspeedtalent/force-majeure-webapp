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

import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SideNavbarLayout } from '@/components/layout/SidebarLayout';
import { MobileHorizontalTabs } from '@/components/mobile';
import { Sliders, Ticket, Images, FileSpreadsheet } from 'lucide-react';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES, FEATURE_FLAGS } from '@/shared';
import { useFeatureFlagHelpers } from '@/shared';
import { PageErrorBoundary } from '@/components/common/feedback';
import { FmFormSectionHeader } from '@/components/common/display/FmSectionHeader';
import { formatHeader } from '@/shared';

// Admin components
import { FeatureToggleSection } from '@/components/DevTools/FeatureToggleSection';
import { AdminTicketingSection } from '@/components/admin/AdminTicketingSection';
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
  DeveloperDatabaseGuestsTab,
  DeveloperDatabaseVenuesTab,
  DeveloperDatabaseRecordingsTab,
  ActivityLogsTab,
  DemoToolsTab,
  DocumentationViewerTab,
} from './tabs';

// Contact Submissions
import { ContactSubmissionsTab } from '@/features/contact-submissions';
import { useDatabaseCounts } from './hooks/useDeveloperDatabaseData';
import { useDeveloperNavigation } from './hooks/useDeveloperNavigation';

// Dashboard components
import RecordingRatingsDashboard from './dashboards/RecordingRatingsDashboard';
import { AnalyticsDashboardContent } from './dashboards/AnalyticsDashboardContent';
import { UserMetricsDashboard } from './dashboards/userMetrics';

// Developer Tools components
import { OrderCsvImportContent } from './orderImport';

// Types
import { DeveloperTab, VALID_TABS, EXTERNAL_ROUTES } from './types';

// ============================================================================
// Component
// ============================================================================

export default function DeveloperHome() {
  useTranslation('common'); // Initialize i18n namespace
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasRole } = useUserPermissions();
  const isAdmin = hasRole(ROLES.ADMIN);
  const { isFeatureEnabled } = useFeatureFlagHelpers();
  const isRecordingRatingsEnabled = isFeatureEnabled(FEATURE_FLAGS.RECORDING_RATINGS);

  // Get all counts for navigation badges
  const counts = useDatabaseCounts();

  // Get navigation configuration from hook
  const { navigationGroups, mobileTabs } = useDeveloperNavigation({
    isAdmin,
    isRecordingRatingsEnabled,
    counts,
  });

  // Get active tab from URL query string
  const tabFromUrl = searchParams.get('tab') as DeveloperTab | null;
  const activeTab: DeveloperTab =
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'db_overview';

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

  // Render tab header for admin/dashboard sections using new gradient styling
  const renderTabHeader = (title: string, description?: string, icon?: typeof Sliders) => (
    <FmFormSectionHeader
      title={formatHeader(title)}
      description={description}
      icon={icon}
    />
  );

  // Check if current tab is the activity logs tab (not contact submissions)
  const isActivityLogTab = activeTab === 'logs_all';

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
            {renderTabHeader('Feature Flags', 'Control feature availability across different environments', Sliders)}
            <FeatureToggleSection />
          </PageErrorBoundary>
        )}

        {activeTab === 'admin_ticketing' && (
          <PageErrorBoundary section="Ticketing">
            {renderTabHeader('Ticketing', 'Configure checkout timer and fees applied to all ticket purchases', Ticket)}
            <AdminTicketingSection />
          </PageErrorBoundary>
        )}

        {/* ======================== DEVELOPER TOOLS ======================== */}
        {activeTab === 'dev_order_import' && (
          <PageErrorBoundary section="Order CSV Import">
            {renderTabHeader('Order CSV Import', 'Import historical orders from CSV files', FileSpreadsheet)}
            <OrderCsvImportContent />
          </PageErrorBoundary>
        )}

        {activeTab === 'dev_demo' && (
          <PageErrorBoundary section="Demo Tools">
            <DemoToolsTab />
          </PageErrorBoundary>
        )}

        {activeTab === 'dev_docs' && (
          <PageErrorBoundary section="Documentation Viewer">
            <DocumentationViewerTab />
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
        {isActivityLogTab && (
          <PageErrorBoundary section="Activity Logs">
            <ActivityLogsTab activeTab={activeTab} />
          </PageErrorBoundary>
        )}

        {/* ======================== CONTACT SUBMISSIONS ======================== */}
        {activeTab === 'logs_contact' && (
          <PageErrorBoundary section="Contact Submissions">
            <ContactSubmissionsTab />
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

        {activeTab === 'db_guests' && (
          <PageErrorBoundary section="Guests">
            <DeveloperDatabaseGuestsTab />
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
            {renderTabHeader('Media Galleries', 'Manage image galleries and media collections for the site.', Images)}
            <GalleryManagementSection />
          </PageErrorBoundary>
        )}

        {activeTab === 'db_registrations' && (
          <PageErrorBoundary section="Artist Registrations">
            <ArtistRegistrationsManagement />
          </PageErrorBoundary>
        )}

        {activeTab === 'db_user_requests' && (
          <PageErrorBoundary section="User Requests">
            <UserRequestsAdmin />
          </PageErrorBoundary>
        )}
      </div>
    </SideNavbarLayout>
  );
}
