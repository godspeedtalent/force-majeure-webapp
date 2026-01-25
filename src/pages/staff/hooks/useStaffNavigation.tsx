import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Users, UserCircle, LayoutDashboard, UserPlus } from 'lucide-react';
import type { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import type { StaffTab, StaffTabCounts } from '../types';

interface UseStaffNavigationProps {
  counts?: StaffTabCounts;
}

interface UseStaffNavigationReturn {
  navigationGroups: FmCommonSideNavGroup<StaffTab>[];
  mobileTabs: Array<{
    id: StaffTab;
    label: string;
    icon: typeof LayoutDashboard;
  }>;
}

/**
 * Staff Navigation Hook
 *
 * Provides navigation structure for the Staff Home page.
 * Separates staffing/admin tools from developer tools.
 */
export function useStaffNavigation({
  counts,
}: UseStaffNavigationProps = {}): UseStaffNavigationReturn {
  const { t } = useTranslation('common');

  const navigationGroups = useMemo<FmCommonSideNavGroup<StaffTab>[]>(
    () => [
      // Dashboards Group
      {
        label: 'Dashboards',
        icon: BarChart3,
        items: [
          {
            id: 'dash_overview',
            label: 'Artist Screening',
            icon: LayoutDashboard,
            description: 'Review and approve artist applications',
          },
          {
            id: 'dash_users',
            label: 'User Metrics',
            icon: Users,
            description: 'User engagement and growth analytics',
          },
        ],
      },
      // Requests Group
      {
        label: 'Requests',
        icon: UserCircle,
        items: [
          {
            id: 'db_registrations',
            label: t('artistRegistrations.navLabel'),
            icon: UserPlus,
            description: t('artistRegistrations.navDescription'),
            badge:
              counts?.pendingRegistrations && counts.pendingRegistrations > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] bg-fm-gold text-black font-bold">
                  {counts.pendingRegistrations}
                </span>
              ) : undefined,
          },
          {
            id: 'db_user_requests',
            label: 'User Requests',
            icon: UserCircle,
            description: 'User account requests',
            badge: counts?.pendingRequests ? (
              <span className="text-xs font-medium text-fm-gold">
                {counts.pendingRequests}
              </span>
            ) : undefined,
          },
        ],
      },
    ],
    [counts, t]
  );

  const mobileTabs = useMemo(
    () => [
      {
        id: 'dash_overview' as StaffTab,
        label: 'Screening',
        icon: LayoutDashboard,
      },
      {
        id: 'dash_users' as StaffTab,
        label: 'Metrics',
        icon: Users,
      },
      {
        id: 'db_registrations' as StaffTab,
        label: 'Registrations',
        icon: UserPlus,
      },
      {
        id: 'db_user_requests' as StaffTab,
        label: 'Requests',
        icon: UserCircle,
      },
    ],
    []
  );

  return {
    navigationGroups,
    mobileTabs,
  };
}
