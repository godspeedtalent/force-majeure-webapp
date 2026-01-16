import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Users,
  TrendingUp,
  Settings,
  LayoutDashboard,
  MapPin,
  Calendar,
  DollarSign,
  Ticket,
  Eye,
  ExternalLink,
} from 'lucide-react';

import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { MobileBottomTabBar, MobileBottomTab } from '@/components/mobile';
import { FmFormSectionHeader } from '@/components/common/display/FmSectionHeader';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmOrganizationSearchDropdown } from '@/components/common/search/FmOrganizationSearchDropdown';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { PERMISSIONS } from '@/shared';
import { useIsMobile, supabase, cn } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useEvents } from '@/shared/api/queries/eventQueries';
import { useVenues } from '@/shared/api/queries/venueQueries';
import { format } from 'date-fns';
import type { Event, Venue } from '@/features/events/types';

/** Tab types for organization management */
type OrganizationToolsTab = 'overview' | 'events' | 'sales' | 'venues' | 'staff' | 'settings';

/**
 * OrganizationTools - Main management page for organization admins
 *
 * Features:
 * - Sidebar navigation with tabs
 * - Overview dashboard with stats
 * - Events management
 * - Sales reports
 * - Venue management
 * - Staff management
 * - Organization settings
 */
const OrganizationTools = () => {
  const { t } = useTranslation('common');
  const { hasAnyPermission, roles } = useUserPermissions();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState<OrganizationToolsTab>('overview');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const isLoading = !roles;

  // Check for organization access permission
  const hasAccess = hasAnyPermission(
    PERMISSIONS.MANAGE_ORGANIZATION,
    PERMISSIONS.VIEW_ORGANIZATION
  );

  // Fetch user's organizations (where they are owner or staff)
  const { data: userOrganizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['user-organizations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get organizations where user is owner
      const { data: ownedOrgs, error: ownedError } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // TODO: Also get organizations where user is staff
      // For now, just return owned organizations
      return ownedOrgs || [];
    },
    enabled: !!user?.id && hasAccess,
  });

  // Auto-select first organization if user only has one
  useEffect(() => {
    if (userOrganizations && userOrganizations.length === 1 && !selectedOrgId) {
      setSelectedOrgId(userOrganizations[0].id);
    }
  }, [userOrganizations, selectedOrgId]);

  // Fetch organization details
  const { data: organization } = useQuery({
    queryKey: ['organization', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', selectedOrgId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedOrgId,
  });

  // Fetch events (all events for now, we'd filter by org in real implementation)
  const { data: events = [], isLoading: eventsLoading } = useEvents();

  // Fetch venues (all venues for now)
  const { data: venues = [], isLoading: venuesLoading } = useVenues();

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      navigate('/');
    }
  }, [isLoading, navigate, hasAccess]);

  // Navigation groups for sidebar
  const navigationGroups: FmCommonSideNavGroup<OrganizationToolsTab>[] = useMemo(
    () => [
      {
        label: t('organization.manage.nav.organization'),
        icon: Building2,
        items: [
          {
            id: 'overview' as const,
            label: t('organization.manage.nav.overview'),
            icon: LayoutDashboard,
            description: t('organization.manage.nav.overviewDescription'),
          },
          {
            id: 'events' as const,
            label: t('organization.manage.nav.events'),
            icon: Calendar,
            description: t('organization.manage.nav.eventsDescription'),
          },
          {
            id: 'sales' as const,
            label: t('organization.manage.nav.sales'),
            icon: TrendingUp,
            description: t('organization.manage.nav.salesDescription'),
          },
          {
            id: 'venues' as const,
            label: t('organization.manage.nav.venues'),
            icon: MapPin,
            description: t('organization.manage.nav.venuesDescription'),
          },
        ],
      },
      {
        label: t('organization.manage.nav.management'),
        icon: Settings,
        items: [
          {
            id: 'staff' as const,
            label: t('organization.manage.nav.staff'),
            icon: Users,
            description: t('organization.manage.nav.staffDescription'),
          },
          {
            id: 'settings' as const,
            label: t('organization.manage.nav.settings'),
            icon: Settings,
            description: t('organization.manage.nav.settingsDescription'),
          },
        ],
      },
    ],
    [t]
  );

  // Mobile tabs for bottom tab bar
  const mobileTabs: MobileBottomTab[] = useMemo(
    () => [
      { id: 'overview', label: t('organization.manage.nav.overview'), icon: LayoutDashboard },
      { id: 'events', label: t('organization.manage.nav.events'), icon: Calendar },
      { id: 'sales', label: t('organization.manage.nav.sales'), icon: TrendingUp },
      { id: 'venues', label: t('organization.manage.nav.venues'), icon: MapPin },
      { id: 'staff', label: t('organization.manage.nav.staff'), icon: Users },
      { id: 'settings', label: t('organization.manage.nav.settings'), icon: Settings },
    ],
    [t]
  );

  // Mobile bottom tab bar
  const mobileTabBar = useMemo(() => {
    if (!isMobile) return undefined;
    return (
      <MobileBottomTabBar
        tabs={mobileTabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as OrganizationToolsTab)}
      />
    );
  }, [isMobile, mobileTabs, activeTab]);

  if (isLoading || orgsLoading) {
    return (
      <SidebarLayout
        navigationGroups={navigationGroups}
        activeItem={activeTab}
        onItemChange={setActiveTab}
        showBackButton
        backButtonLabel={t('buttons.home')}
        onBack={() => navigate('/')}
      >
        <div className='flex items-center justify-center min-h-[400px]'>
          <FmCommonLoadingSpinner size='lg' />
        </div>
      </SidebarLayout>
    );
  }

  if (!hasAccess) {
    return null;
  }

  // Organization selector for users with multiple organizations
  const renderOrgSelector = () => {
    if (!userOrganizations || userOrganizations.length <= 1) return null;

    return (
      <div className='mb-[20px]'>
        <FmCommonCard className='p-4'>
          <div className='flex items-center gap-4'>
            <Building2 className='h-5 w-5 text-fm-gold' />
            <div className='flex-1'>
              <FmOrganizationSearchDropdown
                value={selectedOrgId}
                onChange={(value) => setSelectedOrgId(value || null)}
                placeholder={t('organization.manage.selectOrganization')}
              />
            </div>
          </div>
        </FmCommonCard>
      </div>
    );
  };

  // Overview Tab - Dashboard with stats
  const renderOverviewTab = () => {
    const upcomingEvents = events.filter(
      (e) => new Date(e.start_time) > new Date()
    ).length;
    const pastEvents = events.filter(
      (e) => new Date(e.start_time) <= new Date()
    ).length;

    return (
      <div className='space-y-[20px]'>
        <FmFormSectionHeader
          title={t('organization.manage.overview.title')}
          description={t('organization.manage.overview.description')}
          icon={LayoutDashboard}
        />

        {/* Stats Grid */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-[20px]'>
          <FmCommonCard className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-fm-gold/10 border border-fm-gold/20'>
                <Calendar className='h-5 w-5 text-fm-gold' />
              </div>
              <div>
                <p className='text-2xl font-bold'>{upcomingEvents}</p>
                <p className='text-xs text-muted-foreground uppercase'>
                  {t('organization.manage.overview.upcomingEvents')}
                </p>
              </div>
            </div>
          </FmCommonCard>

          <FmCommonCard className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-fm-gold/10 border border-fm-gold/20'>
                <MapPin className='h-5 w-5 text-fm-gold' />
              </div>
              <div>
                <p className='text-2xl font-bold'>{venues.length}</p>
                <p className='text-xs text-muted-foreground uppercase'>
                  {t('organization.manage.overview.totalVenues')}
                </p>
              </div>
            </div>
          </FmCommonCard>

          <FmCommonCard className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-fm-gold/10 border border-fm-gold/20'>
                <Ticket className='h-5 w-5 text-fm-gold' />
              </div>
              <div>
                <p className='text-2xl font-bold'>{pastEvents}</p>
                <p className='text-xs text-muted-foreground uppercase'>
                  {t('organization.manage.overview.pastEvents')}
                </p>
              </div>
            </div>
          </FmCommonCard>

          <FmCommonCard className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-fm-gold/10 border border-fm-gold/20'>
                <Users className='h-5 w-5 text-fm-gold' />
              </div>
              <div>
                <p className='text-2xl font-bold'>0</p>
                <p className='text-xs text-muted-foreground uppercase'>
                  {t('organization.manage.overview.staffMembers')}
                </p>
              </div>
            </div>
          </FmCommonCard>
        </div>

        {/* Quick Actions */}
        <FmCommonCard className='p-6'>
          <h3 className='text-lg font-medium mb-4'>
            {t('organization.manage.overview.quickActions')}
          </h3>
          <div className='flex flex-wrap gap-2'>
            <FmCommonButton
              variant='default'
              icon={Calendar}
              onClick={() => setActiveTab('events')}
            >
              {t('organization.manage.overview.viewEvents')}
            </FmCommonButton>
            <FmCommonButton
              variant='default'
              icon={TrendingUp}
              onClick={() => setActiveTab('sales')}
            >
              {t('organization.manage.overview.viewSales')}
            </FmCommonButton>
            <FmCommonButton
              variant='default'
              icon={Users}
              onClick={() => setActiveTab('staff')}
            >
              {t('organization.manage.overview.manageStaff')}
            </FmCommonButton>
          </div>
        </FmCommonCard>
      </div>
    );
  };

  // Events Tab - List of events
  const renderEventsTab = () => {
    const upcomingEvents = events
      .filter((e) => new Date(e.start_time) > new Date())
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const pastEvents = events
      .filter((e) => new Date(e.start_time) <= new Date())
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

    const renderEventCard = (event: Event) => (
      <FmCommonCard
        key={event.id}
        className='p-4 hover:border-fm-gold/50 transition-colors cursor-pointer'
        onClick={() => navigate(`/events/${event.id}/manage`)}
      >
        <div className='flex items-center gap-4'>
          {event.hero_image && (
            <img
              src={event.hero_image}
              alt={event.title}
              className='w-16 h-16 object-cover'
            />
          )}
          <div className='flex-1 min-w-0'>
            <h4 className='font-medium truncate'>{event.title}</h4>
            <p className='text-sm text-muted-foreground'>
              {format(new Date(event.start_time), 'PPP')}
            </p>
            {event.venue && (
              <p className='text-xs text-muted-foreground truncate'>
                {event.venue.name}
              </p>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <span
              className={cn(
                'px-2 py-1 text-xs uppercase',
                event.status === 'published'
                  ? 'bg-green-500/20 text-green-400'
                  : event.status === 'draft'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              )}
            >
              {event.status}
            </span>
            <Eye className='h-4 w-4 text-muted-foreground' />
          </div>
        </div>
      </FmCommonCard>
    );

    return (
      <div className='space-y-[20px]'>
        <FmFormSectionHeader
          title={t('organization.manage.events.title')}
          description={t('organization.manage.events.description')}
          icon={Calendar}
        />

        {eventsLoading ? (
          <div className='flex items-center justify-center min-h-[200px]'>
            <FmCommonLoadingSpinner size='md' />
          </div>
        ) : (
          <>
            {/* Upcoming Events */}
            <div>
              <h3 className='text-sm font-medium text-muted-foreground uppercase mb-3'>
                {t('organization.manage.events.upcoming')} ({upcomingEvents.length})
              </h3>
              {upcomingEvents.length > 0 ? (
                <div className='space-y-2'>
                  {upcomingEvents.map(renderEventCard)}
                </div>
              ) : (
                <FmCommonCard className='p-4'>
                  <p className='text-muted-foreground text-center'>
                    {t('organization.manage.events.noUpcoming')}
                  </p>
                </FmCommonCard>
              )}
            </div>

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h3 className='text-sm font-medium text-muted-foreground uppercase mb-3'>
                  {t('organization.manage.events.past')} ({pastEvents.length})
                </h3>
                <div className='space-y-2'>
                  {pastEvents.slice(0, 5).map(renderEventCard)}
                </div>
                {pastEvents.length > 5 && (
                  <p className='text-sm text-muted-foreground text-center mt-2'>
                    {t('organization.manage.events.andMore', { count: pastEvents.length - 5 })}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Sales Tab - Orders and revenue
  const renderSalesTab = () => {
    return (
      <div className='space-y-[20px]'>
        <FmFormSectionHeader
          title={t('organization.manage.sales.title')}
          description={t('organization.manage.sales.description')}
          icon={TrendingUp}
        />

        {/* Revenue Summary */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-[20px]'>
          <FmCommonCard className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-green-500/10 border border-green-500/20'>
                <DollarSign className='h-5 w-5 text-green-400' />
              </div>
              <div>
                <p className='text-2xl font-bold'>$0</p>
                <p className='text-xs text-muted-foreground uppercase'>
                  {t('organization.manage.sales.totalRevenue')}
                </p>
              </div>
            </div>
          </FmCommonCard>

          <FmCommonCard className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-fm-gold/10 border border-fm-gold/20'>
                <Ticket className='h-5 w-5 text-fm-gold' />
              </div>
              <div>
                <p className='text-2xl font-bold'>0</p>
                <p className='text-xs text-muted-foreground uppercase'>
                  {t('organization.manage.sales.ticketsSold')}
                </p>
              </div>
            </div>
          </FmCommonCard>

          <FmCommonCard className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-blue-500/10 border border-blue-500/20'>
                <TrendingUp className='h-5 w-5 text-blue-400' />
              </div>
              <div>
                <p className='text-2xl font-bold'>0</p>
                <p className='text-xs text-muted-foreground uppercase'>
                  {t('organization.manage.sales.orders')}
                </p>
              </div>
            </div>
          </FmCommonCard>
        </div>

        {/* Sales by Event */}
        <FmCommonCard className='p-6'>
          <h3 className='text-lg font-medium mb-4'>
            {t('organization.manage.sales.salesByEvent')}
          </h3>
          <p className='text-muted-foreground'>
            {t('organization.manage.sales.noSalesData')}
          </p>
        </FmCommonCard>
      </div>
    );
  };

  // Venues Tab - Venue list
  const renderVenuesTab = () => {
    const renderVenueCard = (venue: Venue) => (
      <FmCommonCard
        key={venue.id}
        className='p-4 hover:border-fm-gold/50 transition-colors cursor-pointer'
        onClick={() => navigate(`/venues/${venue.id}`)}
      >
        <div className='flex items-center gap-4'>
          {venue.image_url && (
            <img
              src={venue.image_url}
              alt={venue.name}
              className='w-16 h-16 object-cover'
            />
          )}
          <div className='flex-1 min-w-0'>
            <h4 className='font-medium truncate'>{venue.name}</h4>
            {venue.address_line_1 && (
              <p className='text-sm text-muted-foreground truncate'>
                {venue.address_line_1}
              </p>
            )}
            {venue.capacity && (
              <p className='text-xs text-muted-foreground'>
                {t('organization.manage.venues.capacity')}: {venue.capacity}
              </p>
            )}
          </div>
          <ExternalLink className='h-4 w-4 text-muted-foreground' />
        </div>
      </FmCommonCard>
    );

    return (
      <div className='space-y-[20px]'>
        <FmFormSectionHeader
          title={t('organization.manage.venues.title')}
          description={t('organization.manage.venues.description')}
          icon={MapPin}
        />

        {venuesLoading ? (
          <div className='flex items-center justify-center min-h-[200px]'>
            <FmCommonLoadingSpinner size='md' />
          </div>
        ) : venues.length > 0 ? (
          <div className='space-y-2'>
            {venues.map(renderVenueCard)}
          </div>
        ) : (
          <FmCommonCard className='p-6'>
            <p className='text-muted-foreground text-center'>
              {t('organization.manage.venues.noVenues')}
            </p>
          </FmCommonCard>
        )}
      </div>
    );
  };

  // Staff Tab - Staff management
  const renderStaffTab = () => {
    return (
      <div className='space-y-[20px]'>
        <FmFormSectionHeader
          title={t('organization.manage.staff.title')}
          description={t('organization.manage.staff.description')}
          icon={Users}
        />

        <FmCommonCard className='p-6'>
          <p className='text-muted-foreground'>
            {t('organization.manage.staff.comingSoon')}
          </p>
        </FmCommonCard>
      </div>
    );
  };

  // Settings Tab - Organization settings
  const renderSettingsTab = () => {
    return (
      <div className='space-y-[20px]'>
        <FmFormSectionHeader
          title={t('organization.manage.settings.title')}
          description={t('organization.manage.settings.description')}
          icon={Settings}
        />

        {organization ? (
          <FmCommonCard className='p-6'>
            <div className='space-y-4'>
              {/* Organization Profile Picture */}
              {organization.profile_picture && (
                <div className='flex items-center gap-4'>
                  <img
                    src={organization.profile_picture}
                    alt={organization.name}
                    className='w-20 h-20 object-cover border-2 border-fm-gold/30'
                  />
                  <div>
                    <h3 className='text-xl font-bold'>{organization.name}</h3>
                    <p className='text-sm text-muted-foreground'>
                      {t('organization.manage.settings.organizationProfile')}
                    </p>
                  </div>
                </div>
              )}

              {!organization.profile_picture && (
                <div>
                  <h3 className='text-xl font-bold'>{organization.name}</h3>
                  <p className='text-sm text-muted-foreground'>
                    {t('organization.manage.settings.organizationProfile')}
                  </p>
                </div>
              )}

              {/* Edit Button */}
              <FmCommonButton
                variant='default'
                icon={Settings}
                onClick={() => navigate(`/organizations/${organization.id}/manage`)}
              >
                {t('organization.manage.settings.editOrganization')}
              </FmCommonButton>
            </div>
          </FmCommonCard>
        ) : (
          <FmCommonCard className='p-6'>
            <p className='text-muted-foreground'>
              {t('organization.manage.settings.selectOrgFirst')}
            </p>
          </FmCommonCard>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'events':
        return renderEventsTab();
      case 'sales':
        return renderSalesTab();
      case 'venues':
        return renderVenuesTab();
      case 'staff':
        return renderStaffTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return null;
    }
  };

  return (
    <SidebarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={setActiveTab}
      showBackButton
      backButtonLabel={t('buttons.home')}
      onBack={() => navigate('/')}
      mobileTabBar={mobileTabBar}
      contentWidth='READABLE'
    >
      {renderOrgSelector()}
      {renderTabContent()}
    </SidebarLayout>
  );
};

export default OrganizationTools;
