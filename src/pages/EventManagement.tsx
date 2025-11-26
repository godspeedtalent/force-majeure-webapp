import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { supabase } from '@/shared/api/supabase/client';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { MobileBottomTabBar, MobileBottomTab } from '@/components/mobile';
import { EventArtistManagement } from '@/components/events/artists/EventArtistManagement';
import { EventTicketTierManagement } from '@/components/events/ticketing/EventTicketTierManagement';
import { EventOrderManagement } from '@/components/events/orders';
import { EventAnalytics } from '@/components/events/analytics';
import Reports from './Reports';
import { TrackingLinksManagement } from '@/components/events/tracking/TrackingLinksManagement';
import { EventStatusBadge, PublishEventButton, StatusActionsDropdown } from '@/components/events/status';
import { eventService } from '@/features/events/services/eventService';
import { GuestListSettings } from '@/components/events/social/GuestListSettings';
import { HeroImageFocalPoint } from '@/components/events/overview/HeroImageFocalPoint';

import { toast } from 'sonner';
import { Card } from '@/components/common/shadcn/card';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/common/forms/FmCommonTimePicker';
import { FmImageUpload } from '@/components/common/forms/FmImageUpload';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { format } from 'date-fns';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared/auth/permissions';
import { handleError } from '@/shared/services/errorHandler';
import { AdminLockIndicator } from '@/components/common/indicators';
import { useEventOverviewForm } from './event/hooks/useEventOverviewForm';

type EventTab = 'overview' | 'artists' | 'tiers' | 'orders' | 'sales' | 'reports' | 'tracking' | 'social' | 'admin' | 'view';

export default function EventManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useUserPermissions();
  const isAdmin = hasRole(ROLES.ADMIN);
  const [activeTab, setActiveTab] = useState<EventTab>('overview');
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [orderCount, setOrderCount] = useState(0);

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

  // Overview form management
  const form = useEventOverviewForm(event);

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
      label: 'Event Details',
      icon: Calendar,
      items: [
        {
          id: 'view',
          label: 'View Event',
          icon: Eye,
          description: 'View event details page',
        },
        {
          id: 'overview',
          label: 'Overview',
          icon: FileText,
          description: 'Basic event information',
        },
        {
          id: 'artists',
          label: 'Artists',
          icon: Users,
          description: 'Manage lineup and scheduling',
        },
        {
          id: 'social',
          label: 'Social',
          icon: Share2,
          description: 'Guest list and social settings',
        },
      ],
    },
    {
      label: 'Ticketing',
      icon: Ticket,
      items: [
        {
          id: 'tiers',
          label: 'Ticket Tiers',
          icon: Ticket,
          description: 'Manage ticket pricing and inventory',
        },
        {
          id: 'orders',
          label: 'Orders',
          icon: ShoppingBag,
          description: 'View and manage ticket orders',
        },
        {
          id: 'tracking',
          label: 'Tracking Links',
          icon: Link2,
          description: 'Marketing links and campaign tracking',
        },
      ],
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      items: [
        {
          id: 'sales',
          label: 'Sales Summary',
          icon: DollarSign,
          description: 'Revenue and sales analytics',
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: FileText,
          description: 'Scheduled reports and email delivery',
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: 'Admin',
            icon: Shield,
            items: [
              {
                id: 'admin' as EventTab,
                label: 'Admin Controls',
                icon: Shield,
                description: 'Advanced event controls (Admin only)',
                badge: <AdminLockIndicator position="inline" size="xs" tooltipText="Admin only" />,
              },
            ],
          },
        ]
      : []),
  ];

  // Mobile bottom tabs configuration
  const mobileTabs: MobileBottomTab[] = [
    { id: 'view', label: 'View', icon: Eye },
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'artists', label: 'Artists', icon: Users },
    { id: 'social', label: 'Social', icon: Share2 },
    { id: 'tiers', label: 'Tiers', icon: Ticket },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'tracking', label: 'Links', icon: Link2 },
    { id: 'sales', label: 'Sales', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: FileText },
    ...(isAdmin ? [{ id: 'admin' as EventTab, label: 'Admin', icon: Shield }] : []),
  ];

  const handleSaveOverview = async () => {
    if (!id) return;

    const success = await form.save(id, () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    });

    return success;
  };

  const handleHeroImageUpload = async (publicUrl: string) => {
    if (!id) return;

    await form.saveHeroImage(id, publicUrl, () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    });
  };

  const handleDeleteEvent = async () => {
    if (!id || !event) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.name}"?\n\nThis action cannot be undone. All ticket tiers and orders associated with this event will also be deleted.`
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

      toast.success('Event deleted successfully');

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

  const handlePublishEvent = async () => {
    if (!id) return;
    
    try {
      await eventService.updateEventStatus(id, 'published');
      toast.success('Event published successfully!');
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
        <p className='text-muted-foreground'>Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p className='text-muted-foreground'>Event not found</p>
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
      showBackButton
      onBack={() => navigate(`/event/${id}`)}
      backButtonLabel='Event Details'
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
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-4'>
              <h1 className='text-3xl font-bold text-foreground'>
                {event.name}
              </h1>
              <EventStatusBadge status={(event as any).status || 'draft'} />
            </div>
            <div className='flex items-center gap-2'>
              {((event as any).status === 'draft' || (event as any).status === 'invisible') && (
                <PublishEventButton
                  currentStatus={(event as any).status || 'draft'}
                  onPublish={handlePublishEvent}
                />
              )}
              {((event as any).status === 'published' || (event as any).status === 'invisible') && (
                <StatusActionsDropdown
                  currentStatus={(event as any).status || 'draft'}
                  orderCount={orderCount}
                  onMakeInvisible={handleMakeInvisible}
                />
              )}
            </div>
          </div>
          <p className='text-muted-foreground'>Event Management</p>
        </div>

        {/* Main Content */}
        <div className='space-y-6'>
          {activeTab === 'overview' && (
            <Card className='p-8'>
              <div className='space-y-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h2 className='text-2xl font-bold text-foreground mb-2'>
                      Event Overview
                    </h2>
                    <p className='text-muted-foreground'>
                      Basic event information and details
                    </p>
                  </div>
                  <FmCommonButton
                    onClick={handleSaveOverview}
                    loading={form.isSaving}
                    icon={Save}
                  >
                    Save Changes
                  </FmCommonButton>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Headliner */}
                  <div className='space-y-2'>
                    <Label htmlFor='headliner'>
                      Headliner <span className='text-destructive'>*</span>
                    </Label>
                    <FmArtistSearchDropdown
                      value={form.headlinerId}
                      onChange={value => form.updateField('headlinerId', value)}
                      placeholder='Select headliner'
                    />
                  </div>

                  {/* Venue */}
                  <div className='space-y-2'>
                    <Label htmlFor='venue'>
                      Venue <span className='text-destructive'>*</span>
                    </Label>
                    <FmVenueSearchDropdown
                      value={form.venueId}
                      onChange={value => form.updateField('venueId', value)}
                      placeholder='Select venue'
                    />
                  </div>

                  {/* Event Title & Subtitle */}
                  <div className='space-y-2'>
                    <Label htmlFor='event-title'>
                      Event Title <span className='text-destructive'>*</span>
                    </Label>
                    <Input
                      id='event-title'
                      value={form.customTitle}
                      onChange={e => form.updateField('customTitle', e.target.value)}
                      placeholder='Enter event title'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='event-subtitle'>
                      Subtitle (Optional)
                    </Label>
                    <Input
                      id='event-subtitle'
                      value={form.eventSubtitle}
                      onChange={e => form.updateField('eventSubtitle', e.target.value)}
                      placeholder='Enter event subtitle'
                    />
                  </div>

                  {/* About This Event Description */}
                  <div className='space-y-2 md:col-span-2'>
                    <Label htmlFor='about-event'>
                      About This Event (Optional)
                    </Label>
                    <textarea
                      id='about-event'
                      value={form.aboutEvent}
                      onChange={e => form.updateField('aboutEvent', e.target.value)}
                      placeholder='Enter event description...'
                      className='w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-foreground resize-y'
                      rows={5}
                    />
                  </div>

                  {/* Date & Time */}
                  <div className='space-y-2'>
                    <Label>
                      Event Date & Time{' '}
                      <span className='text-destructive'>*</span>
                    </Label>
                    <div className='flex gap-2'>
                      <FmCommonDatePicker
                        value={form.eventDate}
                        onChange={date => form.updateField('eventDate', date)}
                      />
                      <FmCommonTimePicker
                        value={form.eventDate ? format(form.eventDate, 'HH:mm') : '20:00'}
                        onChange={(time: string) => {
                          if (form.eventDate) {
                            const [hours, minutes] = time.split(':');
                            const newDate = new Date(form.eventDate);
                            newDate.setHours(
                              parseInt(hours),
                              parseInt(minutes)
                            );
                            form.updateField('eventDate', newDate);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* End Time */}
                  <div className='space-y-2'>
                    <Label>End Time</Label>
                    <div className='flex items-center gap-4'>
                      <FmCommonTimePicker
                        value={form.endTime}
                        onChange={time => form.updateField('endTime', time)}
                        disabled={form.isAfterHours}
                      />
                      <div className='flex items-center gap-2'>
                        <Checkbox
                          id='after-hours'
                          checked={form.isAfterHours}
                          onCheckedChange={checked =>
                            form.updateField('isAfterHours', !!checked)
                          }
                        />
                        <Label htmlFor='after-hours' className='cursor-pointer'>
                          After hours
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Hero Image */}
                  <div className='space-y-2 md:col-span-2'>
                    <Label htmlFor='hero-image'>Hero Image</Label>
                    <FmImageUpload
                      eventId={id}
                      currentImageUrl={form.heroImage}
                      isPrimary={true}
                      onUploadComplete={handleHeroImageUpload}
                    />
                  </div>

                  {/* Hero Image Focal Point */}
                  {form.heroImage && (
                    <div className='md:col-span-2'>
                      <HeroImageFocalPoint
                        imageUrl={form.heroImage}
                        focalY={form.heroImageFocalY}
                        onChange={y => form.updateField('heroImageFocalY', y)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'artists' && (
            <EventArtistManagement
              headlinerId={event.headliner_id || ''}
              undercardIds={[]}
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

                  toast.success('Artists updated successfully');
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

          {activeTab === 'admin' && isAdmin && (
            <Card className='p-8'>
              <div className='space-y-6'>
                <div>
                  <h2 className='text-2xl font-bold text-foreground mb-2'>
                    Admin Controls
                  </h2>
                  <p className='text-muted-foreground'>
                    Advanced event management controls
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
                          Delete Event
                        </h3>
                        <p className='text-sm text-muted-foreground mb-4'>
                          Permanently delete this event and all associated data
                          including ticket tiers and orders. This action cannot
                          be undone.
                        </p>
                        <FmCommonButton
                          variant='destructive'
                          icon={Trash2}
                          onClick={handleDeleteEvent}
                          loading={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete Event'}
                        </FmCommonButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </SideNavbarLayout>
  );
}
