/**
 * DeveloperDashboards
 *
 * Developer/admin-only dashboards page with sidebar navigation.
 * Contains various analytics and monitoring dashboards.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Star, BarChart3, Activity, Users } from 'lucide-react';
import { SideNavbarLayout } from '@/components/layout/SidebarLayout';
import type { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';

// Dashboard components - lazy loaded internally for code splitting
import RecordingRatingsDashboard from './dashboards/RecordingRatingsDashboard';

// Dashboard tab types
type DashboardTab = 'recording-ratings' | 'activity' | 'users';

// Navigation configuration
const createNavigationGroups = (
  t: (key: string, fallback: string) => string
): FmCommonSideNavGroup<DashboardTab>[] => [
  {
    label: t('developerDashboards.analytics', 'Analytics'),
    icon: BarChart3,
    items: [
      {
        id: 'recording-ratings',
        label: t('developerDashboards.recordingRatings', 'Recording Ratings'),
        icon: Star,
        description: t(
          'developerDashboards.recordingRatingsDesc',
          'Rate and analyze artist recordings'
        ),
      },
    ],
  },
  {
    label: t('developerDashboards.monitoring', 'Monitoring'),
    icon: Activity,
    items: [
      {
        id: 'activity',
        label: t('developerDashboards.activityLog', 'Activity Log'),
        icon: Activity,
        description: t(
          'developerDashboards.activityLogDesc',
          'View recent system activity'
        ),
      },
      {
        id: 'users',
        label: t('developerDashboards.userMetrics', 'User Metrics'),
        icon: Users,
        description: t(
          'developerDashboards.userMetricsDesc',
          'User engagement analytics'
        ),
      },
    ],
  },
];

// Placeholder for future dashboards
function PlaceholderDashboard({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-[400px]">
      <div className="text-center space-y-2">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-medium">{title}</h2>
        <p className="text-muted-foreground">Under development</p>
      </div>
    </div>
  );
}

export default function DeveloperDashboards() {
  const { t } = useTranslation('pages');
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial tab from URL or default to recording-ratings
  const initialTab = (searchParams.get('tab') as DashboardTab) || 'recording-ratings';
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);

  const navigationGroups = createNavigationGroups(t);

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Render the active dashboard
  const renderDashboard = () => {
    switch (activeTab) {
      case 'recording-ratings':
        return <RecordingRatingsDashboard />;
      case 'activity':
        return <PlaceholderDashboard title="Activity Log" />;
      case 'users':
        return <PlaceholderDashboard title="User Metrics" />;
      default:
        return <RecordingRatingsDashboard />;
    }
  };

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={handleTabChange}
      showDividers
    >
      {renderDashboard()}
    </SideNavbarLayout>
  );
}
