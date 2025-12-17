import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Users,
  Ticket,
  DollarSign,
  ShoppingBag,
  Calendar,
  Save,
  BarChart3,
  Shield,
  Trash2,
  Link2,
  Eye,
  Share2,
  Palette,
} from 'lucide-react';
import { supabase } from '@force-majeure/shared';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmBackButton } from '@/components/common/buttons/FmBackButton';
import { MobileBottomTabBar, MobileBottomTab } from '@/components/mobile';
import { EventArtistManagement } from '@/components/events/artists/EventArtistManagement';
import { UndercardRequestsList } from '@/components/events/artists/UndercardRequestsList';
import { EventTicketTierManagement } from '@/components/events/ticketing/EventTicketTierManagement';
import { EventOrderManagement } from '@/components/events/orders';
import { EventAnalytics } from '@/components/events/analytics';
import Reports from './Reports';
import { TrackingLinksManagement } from '@/components/events/tracking/TrackingLinksManagement';
import { EventStatusBadge, PublishEventButton } from '@/components/events/status';
import { eventService } from '@/features/events/services/eventService';
import { GuestListSettings } from '@/components/events/social/GuestListSettings';
import { EventOverviewForm } from '@/components/events/overview/EventOverviewForm';
import { EventQueueConfigForm } from '@/components/events/queue';

import { toast } from 'sonner';
import { Card } from '@/components/common/shadcn/card';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { Label } from '@/components/common/shadcn/label';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@force-majeure/shared';
import { handleError } from '@/shared/services/errorHandler';
import { AdminLockIndicator } from '@/components/common/indicators';
import { useEventOverviewForm } from './event/hooks/useEventOverviewForm';

type EventTab = 'overview' | 'artists' | 'tiers' | 'orders' | 'sales' | 'reports' | 'tracking' | 'social' | 'ux_display' | 'admin' | 'view';

export default function EventManagement() {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useUserPermissions();
  const isAdmin = hasRole(ROLES.ADMIN);
  const [activeTab, setActiveTab] = useState<EventTab>('overview');
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [displaySubtitle, setDisplaySubtitle] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch event data
  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      if (!id) throw new Error('No event ID provided');

      const { data, error } = await supabase
        .from('events')
        .select(
          `
          *,
          venues(id, name),
          artists!events_headliner_id_fkey(id, name)
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Sync displaySubtitle from event data (for UX Display tab)
  useEffect(() => {
    if (event) {
      setDisplaySubtitle((event as any).display_subtitle ?? true);
    }
  }, [event]);

  // Fetch order count for status actions
  useEffect(() => {
    const fetchOrderCount = async () => {
      if (id) {
        const count = await eventService.getEventOrderCount(id);
        setOrderCount(count);
      }
    };
    fetchOrderCount();
  }, [id]);

  // Navigation groups configuration
  const navigationGroups: FmCommonSideNavGroup<EventTab>[] = [
    {
      label: t('eventNav.eventDetails'),
      icon: Calendar,
      items: [
        {
          id: 'view',
          label: t('eventNav.viewEvent'),
          icon: Eye,
          description: t('eventNav.viewEventDescription'),
        },
        {
          id: 'overview',
          label: t('eventNav.overview'),
          icon: FileText,
          description: t('eventNav.overviewDescription'),
        },
        {
          id: 'artists',
          label: t('eventNav.artists'),
          icon: Users,
          description: t('eventNav.artistsDescription'),
        },
        {
          id: 'social',
          label: t('eventNav.social'),
          icon: Share2,
          description: t('eventNav.socialDescription'),
        },
        {
          id: 'ux_display',
          label: t('eventNav.uxDisplay'),
          icon: Palette,
          description: t('eventNav.uxDisplayDescription'),
        },
      ],
    },
    {
      label: t('eventNav.ticketing'),
      icon: Ticket,
      items: [
        {
          id: 'tiers',
          label: t('eventNav.ticketTiers'),
          icon: Ticket,
          description: t('eventNav.ticketTiersDescription'),
        },
        {
          id: 'orders',
          label: t('eventNav.orders'),
          icon: ShoppingBag,
          description: t('eventNav.ordersDescription'),
        },
        {
          id: 'tracking',
          label: t('eventNav.trackingLinks'),
          icon: Link2,
          description: t('eventNav.trackingLinksDescription'),
        },
      ],
    },
    {
      label: t('eventNav.analytics'),
      icon: BarChart3,
      items: [
        {
          id: 'sales',
          label: t('eventNav.salesSummary'),
          icon: DollarSign,
          description: t('eventNav.salesSummaryDescription'),
        },
        {
          id: 'reports',
          label: t('eventNav.reports'),
          icon: FileText,
          description: t('eventNav.reportsDescription'),
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: t('eventNav.admin'),
            icon: Shield,
            items: [
              {
                id: 'admin' as EventTab,
                label: t('eventNav.adminControls'),
                icon: Shield,
                description: t('eventNav.adminControlsDescription'),
                badge: <AdminLockIndicator position="inline" size="xs" tooltipText={t('nav.adminOnly')} />,
              },
            ],
          },
        ]
      : []),
  ];

  // Mobile bottom tabs configuration
  const mobileTabs: MobileBottomTab[] = [
    { id: 'view', label: t('eventNav.viewEvent'), icon: Eye },
    { id: 'overview', label: t('eventNav.overview'), icon: FileText },
    { id: 'artists', label: t('eventNav.artists'), icon: Users },
    { id: 'social', label: t('eventNav.social'), icon: Share2 },
    { id: 'ux_display', label: t('eventNav.uxDisplay'), icon: Palette },
    { id: 'tiers', label: t('eventNav.ticketTiers'), icon: Ticket },
    { id: 'orders', label: t('eventNav.orders'), icon: ShoppingBag },
    { id: 'tracking', label: t('eventNav.trackingLinks'), icon: Link2 },
    { id: 'sales', label: t('eventNav.salesSummary'), icon: DollarSign },
    { id: 'reports', label: t('eventNav.reports'), icon: FileText },
    ...(isAdmin ? [{ id: 'admin' as EventTab, label: t('eventNav.adminControls'), icon: Shield }] : []),
  ];

  const handleDeleteEvent = async () => {
    if (!id || !event) return;

    const confirmed = window.confirm(
      t('eventManagement.deleteEventConfirm', { title: event.title })
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      // Delete ticket tiers first (foreign key constraint)
      const { error: tiersError } = await supabase
        .from('ticket_tiers' as any)
        .delete()
        .eq('event_id', id);

      if (tiersError) throw tiersError;

      // Delete the event
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (eventError) throw eventError;

      toast.success(tToast('events.deleted'));

      // Navigate back to admin or home
      navigate('/admin');
    } catch (error) {
      await handleError(error, {
        title: 'Failed to Delete Event',
        description: 'Could not delete the event',
        endpoint: 'EventManagement/delete',
        method: 'DELETE',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveUXDisplay = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({
          display_subtitle: displaySubtitle,
        } as any)
        .eq('id', id!);

      if (error) throw error;

      toast.success(tToast('events.uxSettingsUpdated'));
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    } catch (error) {
      await handleError(error, {
        title: 'Failed to Update UX Display',
        description: 'Could not save UX display settings',
        endpoint: 'EventManagement/ux-display',
        method: 'UPDATE',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishEvent = async () => {
    if (!id) return;

    try {
      await eventService.updateEventStatus(id, 'published');
      toast.success(tToast('events.published'));
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    } catch (error) {
      await handleError(error, {
        title: 'Failed to Publish Event',
        description: 'Could not publish the event',
        endpoint: 'EventManagement',
        method: 'UPDATE',
      });
    }
  };

  const handleMakeInvisible = async () => {
    if (!id) return;
    
    try {
      await eventService.updateEventStatus(id, 'invisible');
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    } catch (error) {
      await handleError(error, {
        title: 'Failed to Hide Event',
        description: 'Could not hide the event',
        endpoint: 'EventManagement',
        method: 'UPDATE',
      });
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p className='text-muted-foreground'>{t('eventManagement.loadingEvent')}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p className='text-muted-foreground'>{t('eventManagement.eventNotFound')}</p>
      </div>
    );
  }

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={(tab) => {
        if (tab === 'view') {
          navigate(`/event/${id}`);
        } else {
          setActiveTab(tab);
        }
      }}
      showDividers
      mobileTabBar={
        <MobileBottomTabBar
          tabs={mobileTabs}
          activeTab={activeTab}
          onTabChange={tab => {
            if (tab === 'view') {
              navigate(`/event/${id}`);
            } else {
              setActiveTab(tab as EventTab);
            }
          }}
        />
      }
    >
      <div className='max-w-full'>
        {/* Top Row: Back Button + Status Badge */}
        <div className='flex items-center justify-between mb-4'>
          <FmBackButton
            position='inline'
            onClick={() => navigate(`/event/${id}`)}
            label={t('eventNav.eventDetails')}
          />
          <div className='flex items-center gap-2'>
            <EventStatusBadge status={(event as any).status || 'draft'} />
            {((event as any).status === 'draft' || (event as any).status === 'invisible') && (
              <PublishEventButton
                currentStatus={(event as any).status || 'draft'}
                onPublish={handlePublishEvent}
              />
            )}
          </div>
        </div>

        {/* Title */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-foreground'>
            {event.title}
          </h1>
        </div>

        {/* Main Content */}
        <div className='space-y-6'>
          {activeTab === 'overview' && id && (
            <EventOverviewForm
              eventId={id}
              event={event}
              orderCount={orderCount}
              onMakeInvisible={handleMakeInvisible}
            />
          )}

          {activeTab === 'artists' && (
            <div className='space-y-8'>
              <EventArtistManagement
                headlinerId={event.headliner_id || ''}
                undercardIds={[]}
                lookingForUndercard={(event as any).looking_for_undercard ?? false}
                onLookingForUndercardChange={async (checked) => {
                  try {
                    if (!id) throw new Error('Event ID is required');

                    const { error } = await supabase
                      .from('events')
                      .update({ looking_for_undercard: checked })
                      .eq('id', id);

                    if (error) throw error;

                    toast.success(checked ? t('eventManagement.lookingForUndercardEnabled') : t('eventManagement.lookingForUndercardDisabled'));
                    queryClient.invalidateQueries({ queryKey: ['event', id] });
                  } catch (error) {
                    await handleError(error, {
                      title: 'Failed to Update Setting',
                      description: 'Could not save looking for undercard setting',
                      endpoint: 'EventManagement/artists',
                      method: 'UPDATE',
                    });
                  }
                }}
                onChange={async (data) => {
                  try {
                    if (!id) throw new Error('Event ID is required');

                    // Update the headliner in the events table
                    const { error: eventError } = await supabase
                      .from('events')
                      .update({ headliner_id: data.headlinerId })
                      .eq('id', id);

                    if (eventError) throw eventError;

                    // Update undercard artists in event_artists junction table
                    // First, delete existing undercard artists
                    const { error: deleteError } = await supabase
                      .from('event_artists')
                      .delete()
                      .eq('event_id', id);

                    if (deleteError) throw deleteError;

                    // Then insert new undercard artists
                    if (data.undercardIds.length > 0) {
                      const undercardRecords = data.undercardIds.map(artistId => ({
                        event_id: id,
                        artist_id: artistId,
                      }));

                      const { error: insertError } = await supabase
                        .from('event_artists')
                        .insert(undercardRecords);

                      if (insertError) throw insertError;
                    }

                    toast.success(tToast('events.artistsUpdated'));
                    queryClient.invalidateQueries({ queryKey: ['event', id] });
                  } catch (error) {
                    await handleError(error, {
                      title: 'Failed to Update Artists',
                      description: 'Could not save artist changes',
                      endpoint: 'EventManagement/artists',
                      method: 'UPDATE',
                    });
                  }
                }}
              />

              {/* Undercard Requests - shows artists who signed up via "Looking for Artists" */}
              {id && <UndercardRequestsList eventId={id} />}
            </div>
          )}

          {activeTab === 'tiers' && id && (
            <EventTicketTierManagement eventId={id} />
          )}

          {activeTab === 'orders' && id && (
            <EventOrderManagement eventId={id} />
          )}

          {activeTab === 'sales' && id && (
            <EventAnalytics eventId={id} />
          )}

          {activeTab === 'reports' && id && (
            <Reports eventId={id} />
          )}

          {activeTab === 'tracking' && id && (
            <TrackingLinksManagement eventId={id} />
          )}

          {activeTab === 'social' && id && (
            <GuestListSettings eventId={id} />
          )}

          {activeTab === 'ux_display' && (
            <Card className='p-8 relative'>
              {/* Sticky Save Button */}
              <div className='sticky top-0 z-10 -mx-8 -mt-8 px-8 pt-8 pb-6 bg-card border-b border-border mb-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h2 className='text-2xl font-bold text-foreground mb-2'>
                      {t('eventManagement.uxDisplaySettings')}
                    </h2>
                    <p className='text-muted-foreground'>
                      {t('eventManagement.uxDisplayDescription')}
                    </p>
                  </div>
                  <FmCommonButton
                    onClick={handleSaveUXDisplay}
                    loading={isSaving}
                    icon={Save}
                  >
                    {t('buttons.saveChanges')}
                  </FmCommonButton>
                </div>
              </div>

                <div className='space-y-6'>
                  {/* Homepage Event Card Section */}
                  <div className='space-y-4'>
                    <h3 className='text-lg font-semibold text-foreground'>
                      {t('eventManagement.homepageEventCard')}
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      {t('eventManagement.homepageEventCardDescription')}
                    </p>

                    <div className='flex items-center gap-3 p-4 rounded-none border border-border bg-card'>
                      <Checkbox
                        id='display-subtitle'
                        checked={displaySubtitle}
                        onCheckedChange={checked => setDisplaySubtitle(!!checked)}
                      />
                      <div className='flex-1'>
                        <Label htmlFor='display-subtitle' className='cursor-pointer font-medium'>
                          {t('eventManagement.displaySubtitle')}
                        </Label>
                        <p className='text-xs text-muted-foreground mt-1'>
                          {t('eventManagement.displaySubtitleDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
            </Card>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className='space-y-6'>
              {/* Queue Configuration */}
              {id && <EventQueueConfigForm eventId={id} />}

              {/* Delete Event Card */}
              <Card className='p-8'>
                <div className='space-y-6'>
                  <div>
                    <h2 className='text-2xl font-bold text-foreground mb-2'>
                      {t('eventManagement.dangerZone')}
                    </h2>
                    <p className='text-muted-foreground'>
                      {t('eventManagement.irreversibleActions')}
                    </p>
                  </div>

                  <div className='space-y-4'>
                    <div className='rounded-none border border-destructive/50 bg-destructive/5 p-6'>
                      <div className='flex items-start gap-4'>
                        <div className='p-3 rounded-none bg-destructive/10'>
                          <Trash2 className='h-6 w-6 text-destructive' />
                        </div>
                        <div className='flex-1'>
                          <h3 className='text-lg font-semibold text-foreground mb-2'>
                            {t('eventManagement.deleteEvent')}
                          </h3>
                          <p className='text-sm text-muted-foreground mb-4'>
                            {t('eventManagement.deleteEventDescription')}
                          </p>
                          <FmCommonButton
                            variant='destructive'
                            icon={Trash2}
                            onClick={handleDeleteEvent}
                            loading={isDeleting}
                          >
                            {isDeleting ? t('buttons.deleting') : t('eventManagement.deleteEvent')}
                          </FmCommonButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </SideNavbarLayout>
  );
}
