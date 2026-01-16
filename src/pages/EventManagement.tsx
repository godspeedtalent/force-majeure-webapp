import { useState, useEffect, useCallback } from 'react';
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
  BarChart3,
  Shield,
  Trash2,
  Link2,
  Eye,
  Share2,
  Palette,
  Images,
  Tag,
  UserCog,
  Handshake,
} from 'lucide-react';
import { supabase } from '@/shared';
import { SidebarLayout } from '@/components/layout/SidebarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { MobileBottomTabBar, MobileBottomTab } from '@/components/mobile';
import { EventArtistManagement } from '@/components/events/artists/EventArtistManagement';
import { UndercardRequestsList } from '@/components/events/artists/UndercardRequestsList';
import { EventTicketTierManagement } from '@/components/events/ticketing/EventTicketTierManagement';
import { EventOrderManagement } from '@/components/events/orders';
import { EventAnalytics } from '@/components/events/analytics';
import Reports from './Reports';
import { TrackingLinksManagement } from '@/components/events/tracking/TrackingLinksManagement';
import { EventStatusBadge, PublishEventButton, EventTicketStatusDashboard } from '@/components/events/status';
import { eventService } from '@/features/events/services/eventService';
import type { EventStatus } from '@/features/events/types';
import { GuestListSettings } from '@/components/events/social/GuestListSettings';
import { EventOverviewForm } from '@/components/events/overview/EventOverviewForm';
import { EventQueueConfigForm } from '@/components/events/queue';
import { EventGalleryTab } from '@/components/events/gallery';
import { TestEventConfigSection } from '@/components/events/admin';
import { EventPromoCodeManagement } from '@/components/events/promo';
import { EventStaffingManagement, EventPartnerManagement } from '@/components/events/staffing';

import { toast } from 'sonner';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { Label } from '@/components/common/shadcn/label';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import { AdminLockIndicator } from '@/components/common/indicators';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { PageErrorBoundary } from '@/components/common/feedback';
import { FmStickyFormFooter } from '@/components/common/forms/FmStickyFormFooter';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmTabContentHeader } from '@/components/common/headers/FmTabContentHeader';
import { FmContentContainer } from '@/components/common/layout/FmContentContainer';

type EventTab = 'overview' | 'gallery' | 'artists' | 'tiers' | 'orders' | 'ticket-status' | 'sales' | 'reports' | 'tracking' | 'promo-codes' | 'social' | 'ux_display' | 'staffing' | 'partners' | 'admin' | 'view';

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
  const [displaySubtitle, setDisplaySubtitle] = useState<boolean>(true);
  const [showPartners, setShowPartners] = useState<boolean>(true);
  const [showGuestList, setShowGuestList] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state for sticky footer
  const [overviewFormState, setOverviewFormState] = useState<{
    isDirty: boolean;
    isSaving: boolean;
    onSave: () => void;
    onUndo: () => void;
  }>({ isDirty: false, isSaving: false, onSave: () => {}, onUndo: () => {} });

  const [queueConfigFormState, setQueueConfigFormState] = useState<{
    isDirty: boolean;
    isSaving: boolean;
    onSave: () => void;
    onUndo: () => void;
  }>({ isDirty: false, isSaving: false, onSave: () => {}, onUndo: () => {} });

  const handleOverviewFormStateChange = useCallback((state: { isDirty: boolean; isSaving: boolean; onSave: () => void; onUndo: () => void }) => {
    setOverviewFormState(state);
  }, []);

  const handleQueueConfigFormStateChange = useCallback((state: { isDirty: boolean; isSaving: boolean; onSave: () => void; onUndo: () => void }) => {
    setQueueConfigFormState(state);
  }, []);

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

  // Fetch event artists with scheduling data from event_artists junction table
  const { data: eventArtistsData } = useQuery({
    queryKey: ['event-artists', id],
    queryFn: async () => {
      if (!id) return [];

      const { data, error } = await supabase
        .from('event_artists')
        .select('artist_id, set_time, set_order')
        .eq('event_id', id)
        .order('set_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Extract undercard IDs for backwards compatibility
  const undercardArtists = eventArtistsData?.map(item => item.artist_id) || [];

  // Sync UX Display state from event data
  // Note: show_partners and show_guest_list are new columns added via migration
  useEffect(() => {
    if (event) {
      setDisplaySubtitle(event.display_subtitle ?? true);
      // Type assertion needed until Supabase types are regenerated after migration
      setShowPartners((event as { show_partners?: boolean }).show_partners ?? true);
      setShowGuestList((event as { show_guest_list?: boolean }).show_guest_list ?? true);
    }
  }, [event]);

  // Fetch order count for status actions - using React Query for automatic refresh
  const { data: orderCount = 0 } = useQuery({
    queryKey: ['order-count', id],
    queryFn: async () => {
      if (!id) return 0;
      return eventService.getEventOrderCount(id);
    },
    enabled: !!id,
  });

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
          isExternal: true,
        },
        {
          id: 'overview',
          label: t('eventNav.overview'),
          icon: FileText,
          description: t('eventNav.overviewDescription'),
        },
        {
          id: 'gallery',
          label: t('eventNav.gallery'),
          icon: Images,
          description: t('eventNav.galleryDescription'),
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
          id: 'ticket-status',
          label: t('eventNav.ticketStatus'),
          icon: BarChart3,
          description: t('eventNav.ticketStatusDescription'),
        },
        {
          id: 'tracking',
          label: t('eventNav.trackingLinks'),
          icon: Link2,
          description: t('eventNav.trackingLinksDescription'),
        },
        {
          id: 'promo-codes',
          label: t('eventNav.promoCodes'),
          icon: Tag,
          description: t('eventNav.promoCodesDescription'),
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
    {
      label: t('eventNav.operations'),
      icon: UserCog,
      items: [
        {
          id: 'staffing',
          label: t('eventNav.staffing'),
          icon: UserCog,
          description: t('eventNav.staffingDescription'),
        },
        {
          id: 'partners',
          label: t('eventNav.partners'),
          icon: Handshake,
          description: t('eventNav.partnersDescription'),
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
    { id: 'gallery', label: t('eventNav.gallery'), icon: Images },
    { id: 'artists', label: t('eventNav.artists'), icon: Users },
    { id: 'social', label: t('eventNav.social'), icon: Share2 },
    { id: 'ux_display', label: t('eventNav.uxDisplay'), icon: Palette },
    { id: 'tiers', label: t('eventNav.ticketTiers'), icon: Ticket },
    { id: 'orders', label: t('eventNav.orders'), icon: ShoppingBag },
    { id: 'ticket-status', label: t('eventNav.ticketStatus'), icon: BarChart3 },
    { id: 'tracking', label: t('eventNav.trackingLinks'), icon: Link2 },
    { id: 'promo-codes', label: t('eventNav.promoCodes'), icon: Tag },
    { id: 'sales', label: t('eventNav.salesSummary'), icon: DollarSign },
    { id: 'reports', label: t('eventNav.reports'), icon: FileText },
    { id: 'staffing', label: t('eventNav.staffing'), icon: UserCog },
    { id: 'partners', label: t('eventNav.partners'), icon: Handshake },
    ...(isAdmin ? [{ id: 'admin' as EventTab, label: t('eventNav.adminControls'), icon: Shield }] : []),
  ];

  const handleDeleteEvent = async () => {
    if (!id || !event) return;

    setIsDeleting(true);
    try {
      // Delete ticket tiers first (foreign key constraint)
      const { error: tiersError } = await supabase
        .from('ticket_tiers')
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
        title: tToast('events.deleteFailed'),
        description: tToast('events.deleteFailedDescription'),
        endpoint: 'EventManagement/delete',
        method: 'DELETE',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveUXConfig = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({
          display_subtitle: displaySubtitle,
          show_partners: showPartners,
          show_guest_list: showGuestList,
        })
        .eq('id', id!);

      if (error) throw error;

      toast.success(tToast('events.uxSettingsUpdated'));
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    } catch (error) {
      await handleError(error, {
        title: tToast('events.uxDisplayUpdateFailed'),
        description: tToast('events.uxDisplayUpdateFailedDescription'),
        endpoint: 'EventManagement/ux-config',
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
        title: tToast('events.publishFailed'),
        description: tToast('events.publishFailedDescription'),
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
        title: tToast('events.hideFailed'),
        description: tToast('events.hideFailedDescription'),
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

  // Check if event is in test mode
  const isTestMode = event?.status === 'test';

  return (
    <SidebarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={(tab) => {
        if (tab === 'view') {
          navigate(`/event/${id}`);
        } else {
          setActiveTab(tab);
        }
      }}
      showBackButton
      onBack={() => navigate(`/event/${id}`)}
      backButtonLabel={t('eventNav.eventDetails')}
      rootClassName={isTestMode ? 'test-mode' : ''}
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
      {/* Title with Status Badge */}
      <FmTabContentHeader
        title={event.title || ''}
        size="large"
        className="mb-6"
        centeredBadge={<EventStatusBadge status={(event.status ?? 'draft') as EventStatus} />}
      />

      {/* Main Content - Form tabs use READABLE, Data/Analytics tabs use WIDE */}
      {activeTab === 'overview' && id && (
        <FmContentContainer>
          <PageErrorBoundary section='Overview'>
            <EventOverviewForm
              eventId={id}
              event={event}
              orderCount={orderCount}
              onMakeInvisible={handleMakeInvisible}
              onPublish={handlePublishEvent}
              onFormStateChange={handleOverviewFormStateChange}
            />
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {activeTab === 'gallery' && id && (
        <FmContentContainer>
          <PageErrorBoundary section='Gallery'>
            <EventGalleryTab
              eventId={id}
              eventTitle={event.title || ''}
              galleryId={event.gallery_id ?? null}
              heroImage={event.hero_image ?? null}
              heroImageFocalY={event.hero_image_focal_y ?? null}
            />
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {activeTab === 'artists' && (
        <FmContentContainer>
          <PageErrorBoundary section='Artists'>
            <div className='space-y-8'>
              <EventArtistManagement
                headlinerId={event.headliner_id || ''}
                undercardIds={undercardArtists || []}
                initialScheduleData={eventArtistsData?.map(item => ({
                  artistId: item.artist_id,
                  setTime: item.set_time,
                  setOrder: item.set_order,
                })) || []}
                lookingForUndercard={event.looking_for_undercard ?? false}
                footerAction={
                  (event.status === 'draft' || event.status === 'invisible') ? (
                    <PublishEventButton
                      currentStatus={(event.status ?? 'draft') as EventStatus}
                      onPublish={handlePublishEvent}
                    />
                  ) : undefined
                }
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
                      title: tToast('events.updateSettingFailed'),
                      description: tToast('events.updateUndercardSettingFailedDescription'),
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
                      .update({ headliner_id: data.headlinerId || null })
                      .eq('id', id);

                    if (eventError) throw eventError;

                    // Update event_artists junction table with scheduling data
                    // First, delete existing entries
                    const { error: deleteError } = await supabase
                      .from('event_artists')
                      .delete()
                      .eq('event_id', id);

                    if (deleteError) throw deleteError;

                    // Insert all artists with scheduling data (undercard + co-headliners)
                    // Filter out empty artist slots and the main headliner (stored on events table)
                    const artistRecords = data.artistSlots
                      .filter(slot => slot.artistId && slot.role !== 'headliner')
                      .map((slot, index) => {
                        // Convert time string to full timestamp if event has a date
                        let setTime = null;
                        if (slot.setTime && event?.start_time) {
                          const eventDate = new Date(event.start_time);
                          const [hours, minutes] = slot.setTime.split(':').map(Number);
                          eventDate.setHours(hours, minutes, 0, 0);
                          setTime = eventDate.toISOString();
                        }

                        return {
                          event_id: id,
                          artist_id: slot.artistId,
                          set_time: setTime,
                          set_order: slot.order ?? index,
                        };
                      });

                    if (artistRecords.length > 0) {
                      const { error: insertError } = await supabase
                        .from('event_artists')
                        .insert(artistRecords);

                      if (insertError) throw insertError;
                    }

                    toast.success(tToast('events.artistsUpdated'));
                    queryClient.invalidateQueries({ queryKey: ['event', id] });
                    queryClient.invalidateQueries({ queryKey: ['event-artists', id] });
                  } catch (error) {
                    await handleError(error, {
                      title: tToast('events.artistUpdateFailed'),
                      description: tToast('events.artistUpdateFailedDescription'),
                      endpoint: 'EventManagement/artists',
                      method: 'UPDATE',
                    });
                  }
                }}
              />

              {/* Undercard Requests - shows artists who signed up via "Looking for Artists" */}
              {id && <UndercardRequestsList eventId={id} />}
            </div>
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {activeTab === 'tiers' && id && (
        <FmContentContainer>
          <PageErrorBoundary section='Ticket Tiers'>
            <EventTicketTierManagement eventId={id} />
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {activeTab === 'orders' && id && (
        <FmContentContainer scrollable>
          <PageErrorBoundary section='Orders'>
            <EventOrderManagement eventId={id} />
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {activeTab === 'ticket-status' && id && (
        <FmContentContainer>
          <PageErrorBoundary section='Ticket Status'>
            <EventTicketStatusDashboard eventId={id} />
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {activeTab === 'sales' && id && (
        <FmContentContainer width="WIDE">
          <PageErrorBoundary section='Sales Analytics'>
            <EventAnalytics eventId={id} />
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {activeTab === 'reports' && id && (
        <FmContentContainer>
          <PageErrorBoundary section='Reports'>
            <Reports eventId={id} />
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {activeTab === 'tracking' && id && (
        <FmContentContainer>
          <PageErrorBoundary section='Tracking Links'>
            <TrackingLinksManagement eventId={id} />
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {activeTab === 'promo-codes' && id && (
        <FmContentContainer>
          <PageErrorBoundary section='Promo Codes'>
            <EventPromoCodeManagement eventId={id} />
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {activeTab === 'social' && id && (
        <FmContentContainer>
          <PageErrorBoundary section='Social Settings'>
            <GuestListSettings eventId={id} />
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {activeTab === 'ux_display' && (
        <FmContentContainer>
          <PageErrorBoundary section='UX Configuration'>
            <div className='space-y-6'>
              {/* Homepage Event Card Settings */}
              <FmFormSection
                title={t('eventManagement.homepageEventCard')}
                description={t('eventManagement.homepageEventCardDescription')}
                icon={Palette}
              >
                <div className='flex items-center gap-3 p-4 rounded-none border border-border bg-card'>
                  <Palette className='h-5 w-5 text-fm-gold' />
                  <div className='flex-1'>
                    <Label htmlFor='display-subtitle' className='cursor-pointer font-medium'>
                      {t('eventManagement.displaySubtitle')}
                    </Label>
                    <p className='text-xs text-muted-foreground mt-1'>
                      {t('eventManagement.displaySubtitleDescription')}
                    </p>
                  </div>
                  <FmCommonToggle
                    id='display-subtitle'
                    label={t('eventManagement.displaySubtitle')}
                    checked={displaySubtitle}
                    onCheckedChange={checked => setDisplaySubtitle(checked)}
                    hideLabel
                  />
                </div>
              </FmFormSection>

              {/* Event Page Sections */}
              <FmFormSection
                title={t('eventManagement.eventPageSections')}
                description={t('eventManagement.eventPageSectionsDescription')}
                icon={Eye}
              >
                <div className='space-y-3'>
                  <div className='flex items-center gap-3 p-4 rounded-none border border-border bg-card'>
                    <Handshake className='h-5 w-5 text-fm-gold' />
                    <div className='flex-1'>
                      <Label htmlFor='show-partners-ux' className='cursor-pointer font-medium'>
                        {t('eventManagement.showPartners')}
                      </Label>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {t('eventManagement.showPartnersDescription')}
                      </p>
                    </div>
                    <FmCommonToggle
                      id='show-partners-ux'
                      label={t('eventManagement.showPartners')}
                      checked={showPartners}
                      onCheckedChange={checked => setShowPartners(checked)}
                      hideLabel
                    />
                  </div>
                  <div className='flex items-center gap-3 p-4 rounded-none border border-border bg-card'>
                    <Users className='h-5 w-5 text-fm-gold' />
                    <div className='flex-1'>
                      <Label htmlFor='show-guest-list-ux' className='cursor-pointer font-medium'>
                        {t('eventManagement.showGuestList')}
                      </Label>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {t('eventManagement.showGuestListDescription')}
                      </p>
                    </div>
                    <FmCommonToggle
                      id='show-guest-list-ux'
                      label={t('eventManagement.showGuestList')}
                      checked={showGuestList}
                      onCheckedChange={checked => setShowGuestList(checked)}
                      hideLabel
                    />
                  </div>
                </div>
              </FmFormSection>

            </div>
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {activeTab === 'staffing' && id && (
        <FmContentContainer>
          <PageErrorBoundary section='Staffing'>
            <EventStaffingManagement eventId={id} />
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {activeTab === 'partners' && id && (
        <FmContentContainer>
          <PageErrorBoundary section='Partners'>
            <EventPartnerManagement
              eventId={id}
              showPartners={showPartners}
              onShowPartnersChange={setShowPartners}
            />
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {activeTab === 'admin' && isAdmin && (
        <FmContentContainer>
          <PageErrorBoundary section='Admin Controls'>
            <div className='space-y-6'>
              {/* Test Event Configuration */}
              {id && (
                <TestEventConfigSection
                  eventId={id}
                  eventStatus={(event.status ?? 'draft') as EventStatus}
                  isTestEvent={event.test_data ?? false}
                  orderCount={orderCount}
                  onStatusChange={() => {
                    queryClient.invalidateQueries({ queryKey: ['event', id] });
                    queryClient.invalidateQueries({ queryKey: ['order-count', id] });
                  }}
                />
              )}

              {/* Queue Configuration */}
              {id && (
                <EventQueueConfigForm
                  eventId={id}
                  onFormStateChange={handleQueueConfigFormStateChange}
                />
              )}

              {/* Delete Event - Danger Zone */}
              <FmFormSection
                title={t('eventManagement.dangerZone')}
                description={t('eventManagement.irreversibleActions')}
                icon={Trash2}
                className='border-fm-danger/30'
              >
                <div className='p-4 bg-fm-danger/10 border border-fm-danger/20'>
                  <p className='text-sm text-muted-foreground mb-4'>
                    {t('eventManagement.deleteEventDescription')}
                  </p>
                  <FmCommonButton
                    variant='destructive-outline'
                    icon={Trash2}
                    onClick={() => setShowDeleteConfirm(true)}
                    loading={isDeleting}
                  >
                    {isDeleting ? t('buttons.deleting') : t('eventManagement.deleteEvent')}
                  </FmCommonButton>
                </div>
              </FmFormSection>
            </div>
          </PageErrorBoundary>
        </FmContentContainer>
      )}

      {/* Delete Event Confirmation Dialog */}
      <FmCommonConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('eventManagement.deleteEvent')}
        description={t('eventManagement.deleteEventConfirm', { title: event?.title })}
        confirmText={t('buttons.delete')}
        onConfirm={handleDeleteEvent}
        variant="destructive"
        isLoading={isDeleting}
      />

      {/* Sticky Save Footer - shows on overview, ux_display, and admin tabs */}
      {(activeTab === 'overview' || activeTab === 'ux_display' || activeTab === 'admin') && (
        <FmStickyFormFooter
          isDirty={
            activeTab === 'overview' ? overviewFormState.isDirty :
            activeTab === 'admin' ? queueConfigFormState.isDirty :
            false
          }
          isSaving={
            activeTab === 'overview' ? overviewFormState.isSaving :
            activeTab === 'admin' ? queueConfigFormState.isSaving :
            isSaving
          }
          onSave={
            activeTab === 'overview' ? overviewFormState.onSave :
            activeTab === 'admin' ? queueConfigFormState.onSave :
            handleSaveUXConfig
          }
          onUndo={
            activeTab === 'overview' ? overviewFormState.onUndo :
            activeTab === 'admin' ? queueConfigFormState.onUndo :
            undefined
          }
          hasSidebar
        />
      )}
    </SidebarLayout>
  );
}
