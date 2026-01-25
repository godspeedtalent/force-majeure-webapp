/**
 * StaffHome - Staff Management Dashboard
 *
 * Provides staff and organization administrators with tools for:
 * - User metrics and analytics
 * - User account requests
 * - Staff dashboard overview
 *
 * Separated from developer tools to provide a focused interface
 * for organization staff without access to technical developer features.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SideNavbarLayout } from '@/components/layout/SidebarLayout';
import { MobileHorizontalTabs } from '@/components/mobile';
import { PageErrorBoundary } from '@/components/common/feedback';

// Staff components
import { UserRequestsAdmin } from '@/components/admin/UserRequestsAdmin';
import { UserMetricsDashboard } from '@/pages/developer/dashboards/userMetrics';
import { ArtistScreeningDashboard } from '@/features/artist-screening';
import { ArtistRegistrationsManagement } from '@/pages/admin/ArtistRegistrationsManagement';

// Hooks
import { useStaffNavigation } from './hooks/useStaffNavigation';
import { useStaffCounts } from './hooks/useStaffCounts';

// Types
import { StaffTab } from './types';

// Placeholder removed - now using actual ArtistScreeningDashboard

// ============================================================================
// Valid tabs for URL validation
// ============================================================================

const VALID_TABS: StaffTab[] = ['dash_overview', 'dash_users', 'db_user_requests', 'db_registrations'];

// ============================================================================
// Component
// ============================================================================

export default function StaffHome() {
  useTranslation('common'); // Initialize i18n namespace
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get badge counts for navigation
  const counts = useStaffCounts();

  // Get navigation configuration from hook
  const { navigationGroups, mobileTabs } = useStaffNavigation({ counts });

  // Get active tab from URL query string
  const tabFromUrl = searchParams.get('tab') as StaffTab | null;
  const activeTab: StaffTab =
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'dash_overview';

  // Handler to change tabs and update URL
  const handleTabChange = useCallback(
    (tab: StaffTab) => {
      navigate(`?tab=${tab}`);
    },
    [navigate]
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
          onTabChange={tab => handleTabChange(tab as StaffTab)}
        />
      }
    >
      <div className="max-w-full">
        {/* ======================== DASHBOARDS ======================== */}

        {activeTab === 'dash_overview' && (
          <PageErrorBoundary section="Artist Screening">
            <ArtistScreeningDashboard />
          </PageErrorBoundary>
        )}

        {activeTab === 'dash_users' && (
          <PageErrorBoundary section="User Metrics">
            <UserMetricsDashboard />
          </PageErrorBoundary>
        )}

        {/* ======================== REQUESTS ======================== */}

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
