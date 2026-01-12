import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup, FmCommonSideNavItem } from '@/components/common/navigation/FmCommonSideNav';
import { MobileHorizontalTabs, MobileHorizontalTab } from '@/components/mobile';
import {
  MapPin,
  Database,
  Calendar,
  Mic2,
  Building2,
  Users,
  Disc3,
  HardDrive,
  Images,
  UserPlus,
  MessageSquare,
  FileQuestion,
  BarChart3,
  List,
  ShoppingBag,
} from 'lucide-react';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared';
import { AdminLockIndicator } from '@/components/common/indicators';
import { PageErrorBoundary } from '@/components/common/feedback';
import { EventsManagement } from '../admin/EventsManagement';
import { OrganizationsManagement } from '../admin/OrganizationsManagement';
import { UserManagement } from '../admin/UserManagement';
import { GalleryManagementSection } from '@/components/DevTools/GalleryManagementSection';
import { ArtistRegistrationsManagement } from '../admin/ArtistRegistrationsManagement';
import { UserRequestsAdmin } from '@/components/admin/UserRequestsAdmin';
import { useDatabaseCounts } from './hooks/useDeveloperDatabaseData';
import {
  DeveloperDatabaseOverviewTab,
  DeveloperDatabaseArtistsTab,
  DeveloperDatabaseVenuesTab,
  DeveloperDatabaseRecordingsTab,
} from './tabs';

type DatabaseTab =
  | 'overview'
  | 'all_tables'
  | 'artists'
  | 'events'
  | 'galleries'
  | 'orders'
  | 'organizations'
  | 'recordings'
  | 'dashboards'
  | 'registrations'
  | 'user_requests'
  | 'users'
  | 'venues';

const VALID_TABS: DatabaseTab[] = [
  'overview',
  'all_tables',
  'artists',
  'events',
  'galleries',
  'orders',
  'organizations',
  'recordings',
  'dashboards',
  'registrations',
  'user_requests',
  'users',
  'venues',
];

export default function DeveloperDatabase() {
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
    ordersCount,
  } = useDatabaseCounts();

  // Get active tab from URL query string
  const tabFromUrl = searchParams.get('table') as DatabaseTab | null;
  const activeTab: DatabaseTab =
    tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'overview';

  // Navigation groups configuration
  const navigationGroups: FmCommonSideNavGroup<DatabaseTab>[] = useMemo(() => {
    const tables: Array<FmCommonSideNavItem<DatabaseTab> & { sortKey: string }> = [
      {
        id: 'artists',
        label: 'Artists',
        sortKey: 'Artists',
        icon: Mic2,
        description: 'Artist Management',
        badge: <span className="text-[10px] text-muted-foreground">{artistsCount}</span>,
      },
      {
        id: 'events',
        label: 'Events',
        sortKey: 'Events',
        icon: Calendar,
        description: 'Event Management',
        badge: <span className="text-[10px] text-muted-foreground">{eventsCount}</span>,
      },
      {
        id: 'recordings',
        label: 'Recordings',
        sortKey: 'Recordings',
        icon: Disc3,
        description: 'Music Recordings',
        badge: <span className="text-[10px] text-muted-foreground">{recordingsCount}</span>,
      },
      {
        id: 'venues',
        label: 'Venues',
        sortKey: 'Venues',
        icon: MapPin,
        description: 'Venue Management',
        badge: <span className="text-[10px] text-muted-foreground">{venuesCount}</span>,
      },
    ];

    // Add admin-only tabs
    if (isAdmin) {
      tables.push(
        {
          id: 'orders',
          label: (
            <span className="flex items-center gap-1.5">
              Orders
              <AdminLockIndicator position="inline" size="xs" tooltipText="Admin only" />
            </span>
          ),
          sortKey: 'Orders',
          icon: ShoppingBag,
          description: 'Order Management',
          badge: <span className="text-[10px] text-muted-foreground">{ordersCount}</span>,
        },
        {
          id: 'organizations',
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
          id: 'users',
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
    tables.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Messages group items (admin only)
    const messagesItems: Array<FmCommonSideNavItem<DatabaseTab>> = [];

    if (isAdmin) {
      messagesItems.push(
        {
          id: 'registrations',
          label: t('artistRegistrations.navLabel'),
          icon: UserPlus,
          description: t('artistRegistrations.navDescription'),
          badge: pendingRegistrationsCount > 0 ? (
            <span className="px-1.5 py-0.5 text-[10px] bg-fm-gold text-black font-bold">
              {pendingRegistrationsCount}
            </span>
          ) : undefined,
        },
        {
          id: 'user_requests',
          label: 'User Requests',
          icon: FileQuestion,
          description: 'Manage user requests',
          badge: pendingUserRequestsCount > 0 ? (
            <span className="px-1.5 py-0.5 text-[10px] bg-fm-gold text-black font-bold">
              {pendingUserRequestsCount}
            </span>
          ) : undefined,
        }
      );
    }

    const groups: FmCommonSideNavGroup<DatabaseTab>[] = [
      {
        label: 'Dashboard',
        icon: BarChart3,
        items: [
          {
            id: 'overview' as const,
            label: 'Overview',
            icon: Database,
            description: 'Database overview and search',
          },
          {
            id: 'dashboards' as const,
            label: 'Analytics',
            icon: BarChart3,
            description: 'Analytics dashboards',
          },
        ],
      },
      {
        // Tables - no label header, items shown directly
        items: [
          {
            id: 'all_tables' as const,
            label: 'All Tables',
            icon: List,
            description: 'Browse all database tables',
          },
          ...tables,
        ],
      },
      {
        label: 'Storage',
        icon: HardDrive,
        items: [
          {
            id: 'galleries' as const,
            label: 'Galleries',
            icon: Images,
            description: 'Media gallery management',
          },
        ],
      },
    ];

    // Add Messages group only if there are items (admin only)
    if (messagesItems.length > 0) {
      groups.push({
        label: 'Messages',
        icon: MessageSquare,
        items: messagesItems,
      });
    }

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
    ordersCount,
    usersCount,
  ]);

  // Mobile horizontal tabs configuration
  const mobileTabs: MobileHorizontalTab[] = useMemo(() => {
    const baseTabs = [
      { id: 'artists', label: 'Artists', icon: Mic2 },
      { id: 'events', label: 'Events', icon: Calendar },
      { id: 'recordings', label: 'Tracks', icon: Disc3 },
      { id: 'venues', label: 'Venues', icon: MapPin },
    ];
    if (isAdmin) {
      baseTabs.push(
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'organizations', label: 'Orgs', icon: Building2 },
        { id: 'registrations', label: 'Regs', icon: UserPlus },
        { id: 'users', label: 'Users', icon: Users }
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
      navigate(`?table=artists`, { replace: true });
    } else if (state?.openTab && VALID_TABS.includes(state.openTab as DatabaseTab)) {
      navigate(`?table=${state.openTab}`, { replace: true });
    }
  }, [location.state, navigate]);

  // Handler to change tabs and update URL
  const handleTabChange = (tab: DatabaseTab) => {
    if (tab === 'dashboards') {
      navigate('/developer/dashboards');
      return;
    }
    navigate(`?table=${tab}`);
  };

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={handleTabChange}
      mobileHorizontalTabs={
        <MobileHorizontalTabs
          tabs={mobileTabs}
          activeTab={activeTab}
          onTabChange={tab => handleTabChange(tab as DatabaseTab)}
        />
      }
    >
      <div className='max-w-full'>
        {activeTab === 'overview' && (
          <PageErrorBoundary section='Overview'>
            <DeveloperDatabaseOverviewTab />
          </PageErrorBoundary>
        )}
        {activeTab === 'artists' && (
          <PageErrorBoundary section='Artists'>
            <DeveloperDatabaseArtistsTab />
          </PageErrorBoundary>
        )}
        {activeTab === 'venues' && (
          <PageErrorBoundary section='Venues'>
            <DeveloperDatabaseVenuesTab />
          </PageErrorBoundary>
        )}
        {activeTab === 'recordings' && (
          <PageErrorBoundary section='Recordings'>
            <DeveloperDatabaseRecordingsTab />
          </PageErrorBoundary>
        )}
        {activeTab === 'events' && (
          <PageErrorBoundary section='Events'>
            <EventsManagement />
          </PageErrorBoundary>
        )}
        {activeTab === 'organizations' && (
          <PageErrorBoundary section='Organizations'>
            <OrganizationsManagement />
          </PageErrorBoundary>
        )}
        {activeTab === 'users' && (
          <PageErrorBoundary section='Users'>
            <UserManagement />
          </PageErrorBoundary>
        )}

        {activeTab === 'orders' && (
          <PageErrorBoundary section='Orders'>
            <div className='space-y-6'>
              <div>
                <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
                  Orders
                </h1>
                <p className='text-muted-foreground'>
                  View and manage all orders across all events.
                </p>
              </div>
              <div className='bg-black/40 border border-white/10 p-6'>
                <p className='text-muted-foreground text-center py-8'>
                  Orders management coming soon. Use the event-specific order management for now.
                </p>
              </div>
            </div>
          </PageErrorBoundary>
        )}

        {activeTab === 'galleries' && (
          <PageErrorBoundary section='Galleries'>
            <div className='space-y-6'>
              <div>
                <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
                  Media Galleries
                </h1>
                <p className='text-muted-foreground'>
                  Manage image galleries and media collections for the site.
                </p>
              </div>
              <GalleryManagementSection />
            </div>
          </PageErrorBoundary>
        )}

        {activeTab === 'registrations' && (
          <PageErrorBoundary section='Artist Registrations'>
            <ArtistRegistrationsManagement />
          </PageErrorBoundary>
        )}

        {activeTab === 'user_requests' && (
          <PageErrorBoundary section='User Requests'>
            <div className='space-y-6'>
              <div>
                <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
                  User Requests
                </h1>
                <p className='text-muted-foreground'>
                  Review and manage user requests for artist linking, data deletion, and more.
                </p>
              </div>
              <UserRequestsAdmin />
            </div>
          </PageErrorBoundary>
        )}

        {activeTab === 'all_tables' && (
          <PageErrorBoundary section='All Tables'>
            <div className='space-y-6'>
              <div>
                <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
                  All Database Tables
                </h1>
                <p className='text-muted-foreground'>
                  Browse and navigate to all available database tables.
                </p>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {/* Core Tables */}
                <button
                  onClick={() => handleTabChange('artists')}
                  className='p-4 bg-black/40 border border-white/10 hover:border-fm-gold/50 hover:bg-black/60 transition-all text-left group'
                >
                  <div className='flex items-center gap-3 mb-2'>
                    <Mic2 className='h-5 w-5 text-muted-foreground group-hover:text-fm-gold transition-colors' />
                    <span className='font-medium'>Artists</span>
                    <span className='ml-auto text-xs text-muted-foreground'>{artistsCount}</span>
                  </div>
                  <p className='text-xs text-muted-foreground'>Artist profiles and metadata</p>
                </button>

                <button
                  onClick={() => handleTabChange('events')}
                  className='p-4 bg-black/40 border border-white/10 hover:border-fm-gold/50 hover:bg-black/60 transition-all text-left group'
                >
                  <div className='flex items-center gap-3 mb-2'>
                    <Calendar className='h-5 w-5 text-muted-foreground group-hover:text-fm-gold transition-colors' />
                    <span className='font-medium'>Events</span>
                    <span className='ml-auto text-xs text-muted-foreground'>{eventsCount}</span>
                  </div>
                  <p className='text-xs text-muted-foreground'>Event listings and details</p>
                </button>

                <button
                  onClick={() => handleTabChange('venues')}
                  className='p-4 bg-black/40 border border-white/10 hover:border-fm-gold/50 hover:bg-black/60 transition-all text-left group'
                >
                  <div className='flex items-center gap-3 mb-2'>
                    <MapPin className='h-5 w-5 text-muted-foreground group-hover:text-fm-gold transition-colors' />
                    <span className='font-medium'>Venues</span>
                    <span className='ml-auto text-xs text-muted-foreground'>{venuesCount}</span>
                  </div>
                  <p className='text-xs text-muted-foreground'>Venue information and locations</p>
                </button>

                <button
                  onClick={() => handleTabChange('recordings')}
                  className='p-4 bg-black/40 border border-white/10 hover:border-fm-gold/50 hover:bg-black/60 transition-all text-left group'
                >
                  <div className='flex items-center gap-3 mb-2'>
                    <Disc3 className='h-5 w-5 text-muted-foreground group-hover:text-fm-gold transition-colors' />
                    <span className='font-medium'>Recordings</span>
                    <span className='ml-auto text-xs text-muted-foreground'>{recordingsCount}</span>
                  </div>
                  <p className='text-xs text-muted-foreground'>Music recordings and mixes</p>
                </button>

                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleTabChange('organizations')}
                      className='p-4 bg-black/40 border border-white/10 hover:border-fm-gold/50 hover:bg-black/60 transition-all text-left group'
                    >
                      <div className='flex items-center gap-3 mb-2'>
                        <Building2 className='h-5 w-5 text-muted-foreground group-hover:text-fm-gold transition-colors' />
                        <span className='font-medium'>Organizations</span>
                        <span className='ml-auto text-xs text-muted-foreground'>{organizationsCount}</span>
                      </div>
                      <p className='text-xs text-muted-foreground'>Organization management</p>
                    </button>

                    <button
                      onClick={() => handleTabChange('users')}
                      className='p-4 bg-black/40 border border-white/10 hover:border-fm-gold/50 hover:bg-black/60 transition-all text-left group'
                    >
                      <div className='flex items-center gap-3 mb-2'>
                        <Users className='h-5 w-5 text-muted-foreground group-hover:text-fm-gold transition-colors' />
                        <span className='font-medium'>Users</span>
                        <span className='ml-auto text-xs text-muted-foreground'>{usersCount}</span>
                      </div>
                      <p className='text-xs text-muted-foreground'>User profiles and accounts</p>
                    </button>

                    <button
                      onClick={() => handleTabChange('orders')}
                      className='p-4 bg-black/40 border border-white/10 hover:border-fm-gold/50 hover:bg-black/60 transition-all text-left group'
                    >
                      <div className='flex items-center gap-3 mb-2'>
                        <ShoppingBag className='h-5 w-5 text-muted-foreground group-hover:text-fm-gold transition-colors' />
                        <span className='font-medium'>Orders</span>
                        <span className='ml-auto text-xs text-muted-foreground'>{ordersCount}</span>
                      </div>
                      <p className='text-xs text-muted-foreground'>Order records and transactions</p>
                    </button>
                  </>
                )}

                {/* Storage Tables */}
                <button
                  onClick={() => handleTabChange('galleries')}
                  className='p-4 bg-black/40 border border-white/10 hover:border-fm-gold/50 hover:bg-black/60 transition-all text-left group'
                >
                  <div className='flex items-center gap-3 mb-2'>
                    <Images className='h-5 w-5 text-muted-foreground group-hover:text-fm-gold transition-colors' />
                    <span className='font-medium'>Galleries</span>
                  </div>
                  <p className='text-xs text-muted-foreground'>Media galleries and collections</p>
                </button>

                {isAdmin && (
                  <>
                    {/* Messages Tables */}
                    <button
                      onClick={() => handleTabChange('registrations')}
                      className='p-4 bg-black/40 border border-white/10 hover:border-fm-gold/50 hover:bg-black/60 transition-all text-left group'
                    >
                      <div className='flex items-center gap-3 mb-2'>
                        <UserPlus className='h-5 w-5 text-muted-foreground group-hover:text-fm-gold transition-colors' />
                        <span className='font-medium'>Artist Registrations</span>
                        {pendingRegistrationsCount > 0 && (
                          <span className='ml-auto px-1.5 py-0.5 text-[10px] bg-fm-gold text-black font-bold'>
                            {pendingRegistrationsCount}
                          </span>
                        )}
                      </div>
                      <p className='text-xs text-muted-foreground'>Pending artist applications</p>
                    </button>

                    <button
                      onClick={() => handleTabChange('user_requests')}
                      className='p-4 bg-black/40 border border-white/10 hover:border-fm-gold/50 hover:bg-black/60 transition-all text-left group'
                    >
                      <div className='flex items-center gap-3 mb-2'>
                        <FileQuestion className='h-5 w-5 text-muted-foreground group-hover:text-fm-gold transition-colors' />
                        <span className='font-medium'>User Requests</span>
                        {pendingUserRequestsCount > 0 && (
                          <span className='ml-auto px-1.5 py-0.5 text-[10px] bg-fm-gold text-black font-bold'>
                            {pendingUserRequestsCount}
                          </span>
                        )}
                      </div>
                      <p className='text-xs text-muted-foreground'>User feedback and requests</p>
                    </button>
                  </>
                )}
              </div>
            </div>
          </PageErrorBoundary>
        )}
      </div>
    </SideNavbarLayout>
  );
}
