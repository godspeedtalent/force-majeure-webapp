/**
 * useDeveloperNavigation
 *
 * Hook that provides navigation configuration for the DeveloperHome page.
 * Extracted from DeveloperHome to reduce component size.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  // Developer Tools icons
  Database,
  FileText,
  FlaskConical,
  Code,
  FileSpreadsheet,
  Palette,
  // Admin icons
  Shield,
  Sliders,
  DollarSign,
  // Dashboard icons
  BarChart3,
  Star,
  Users,
  LineChart,
  // Messages icons
  Activity,
  Mail,
  UserCircle,
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
import {
  FmCommonSideNavGroup,
  FmCommonSideNavItem,
  FmCommonSideNavSubgroup,
} from '@/components/common/navigation/FmCommonSideNav';
import { MobileHorizontalTab } from '@/components/mobile';
import { AdminLockIndicator } from '@/components/common/indicators';
import type { DeveloperTab } from '../types';

interface UseDeveloperNavigationProps {
  isAdmin: boolean;
  isRecordingRatingsEnabled: boolean;
  counts: {
    pendingRegistrationsCount: number;
    pendingUserRequestsCount: number;
    venuesCount: number;
    organizationsCount: number;
    usersCount: number;
    artistsCount: number;
    eventsCount: number;
    recordingsCount: number;
    guestsCount: number;
  };
}

interface UseDeveloperNavigationResult {
  navigationGroups: FmCommonSideNavGroup<DeveloperTab>[];
  mobileTabs: MobileHorizontalTab[];
}

export function useDeveloperNavigation({
  isAdmin,
  isRecordingRatingsEnabled,
  counts,
}: UseDeveloperNavigationProps): UseDeveloperNavigationResult {
  const { t } = useTranslation('common');

  const {
    pendingRegistrationsCount,
    pendingUserRequestsCount,
    venuesCount,
    organizationsCount,
    usersCount,
    artistsCount,
    eventsCount,
    recordingsCount,
    guestsCount,
  } = counts;

  const navigationGroups: FmCommonSideNavGroup<DeveloperTab>[] = useMemo(() => {
    // Developer Tools group - sorted alphabetically
    const devToolsItems: FmCommonSideNavItem<DeveloperTab>[] = [
      {
        id: 'dev_demo',
        label: t('developerIndex.demoTools'),
        icon: FlaskConical,
        description: t('developerIndex.demoToolsDescription'),
      },
      {
        id: 'dev_docs',
        label: t('developerIndex.documentationViewer'),
        icon: FileText,
        description: t('developerIndex.documentationViewerDescription'),
      },
      {
        id: 'dev_order_import',
        label: t('developerIndex.orderCsvImport'),
        icon: FileSpreadsheet,
        description: t('developerIndex.orderCsvImportDescription'),
      },
      {
        id: 'dev_template_designer',
        label: t('developerIndex.templateDesigner', 'Template Designer'),
        icon: Palette,
        description: t('developerIndex.templateDesignerDescription', 'Customize email and PDF templates'),
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
        id: 'db_guests',
        label: 'Guests',
        sortKey: 'Guests',
        icon: UserCircle,
        description: 'Guest Users',
        badge: <span className="text-[10px] text-muted-foreground">{guestsCount}</span>,
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
        description: 'Venue management',
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
          id: 'logs_all',
          label: t('activityLogsPage.activityLogs'),
          icon: Activity,
          description: t('activityLogsPage.allLogsDescription'),
        },
        {
          id: 'logs_contact',
          label: t('activityLogsPage.contactActivity'),
          icon: Mail,
          description: t('activityLogsPage.contactActivityDescription'),
        },
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

    // Build the groups array
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

    // 3. Developer Tools
    groups.push({
      label: 'Developer',
      icon: Code,
      items: devToolsItems,
    });

    // 4. Messages (top-level, admin only)
    if (isAdmin && messagesItems.length > 0) {
      groups.push({
        label: 'Messages',
        icon: MessageSquare,
        items: messagesItems,
        adminOnly: true,
      });
    }

    // 5. Storage (top-level)
    groups.push({
      label: 'Storage',
      icon: HardDrive,
      items: dbStorageSubgroup.items,
    });

    // 6. Database with subgroups
    const dbSubgroups: FmCommonSideNavSubgroup<DeveloperTab>[] = [
      dbOverviewSubgroup,
      dbTablesSubgroup,
    ];

    groups.push({
      label: 'Database',
      icon: Database,
      subgroups: dbSubgroups,
    });

    return groups;
  }, [
    isAdmin,
    isRecordingRatingsEnabled,
    t,
    pendingRegistrationsCount,
    pendingUserRequestsCount,
    artistsCount,
    eventsCount,
    guestsCount,
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

  return { navigationGroups, mobileTabs };
}
