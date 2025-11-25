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
} from 'lucide-react';
import { supabase } from '@/shared/api/supabase/client';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { MobileBottomTabBar, MobileBottomTab } from '@/components/mobile';
import { EventArtistManagement } from '@/components/events/artists/EventArtistManagement';

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

type EventTab = 'overview' | 'artists' | 'tiers' | 'orders' | 'sales' | 'admin';

export default function EventManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useUserPermissions();
  const isAdmin = hasRole(ROLES.ADMIN);
  const [activeTab, setActiveTab] = useState<EventTab>('overview');
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  // Overview form state
  const [headlinerId, setHeadlinerId] = useState<string>('');
  const [venueId, setVenueId] = useState<string>('');
  const [eventDate, setEventDate] = useState<Date>();
  const [endTime, setEndTime] = useState<string>('02:00');
  const [isAfterHours, setIsAfterHours] = useState(false);
  const [heroImage, setHeroImage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasCustomTitle, setHasCustomTitle] = useState(false);
  const [customTitle, setCustomTitle] = useState<string>('');

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

  // Populate form when event data loads
  useEffect(() => {
    if (event) {
      setHeadlinerId(event.headliner_id || '');
      setVenueId(event.venue_id || '');
      setIsAfterHours(event.is_after_hours || false);
      setEndTime(event.end_time || '02:00');
      setHeroImage(''); // No hero_image in DB yet

      // Check if event has a custom title
      if (event.title) {
        setCustomTitle(event.title);
        setHasCustomTitle(false);
      }

      // Parse date and time from start_time
      if (event.start_time) {
        const parsedDate = new Date(event.start_time);
        setEventDate(parsedDate);
      }
    }
  }, [event]);

  // Navigation groups configuration
  const navigationGroups: FmCommonSideNavGroup<EventTab>[] = [
    {
      label: 'Event Details',
      icon: Calendar,
      items: [
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
      ],
    },
    {
      label: 'Ticketing',
      icon: Ticket,
      items: [
        {
          id: 'tiers',
          label: 'Tier Management',
          icon: Ticket,
          description: 'Manage ticket tiers and pricing',
        },
        {
          id: 'orders',
          label: 'Orders',
          icon: ShoppingBag,
          description: 'View and manage orders',
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
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'artists', label: 'Artists', icon: Users },
    { id: 'tiers', label: 'Tiers', icon: Ticket },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'sales', label: 'Sales', icon: DollarSign },
    ...(isAdmin ? [{ id: 'admin' as EventTab, label: 'Admin', icon: Shield }] : []),
  ];

  const handleEventUpdate = async (updates: any) => {
    try {
      if (!id) throw new Error('Event ID is required');

      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Event updated successfully');
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    } catch (error) {
      await handleError(error, {
        title: 'Failed to Update Event',
        description: 'Could not save event changes',
        endpoint: 'EventManagement',
        method: 'UPDATE',
      });
    }
  };

  const handleSaveOverview = async () => {
    if (!headlinerId || !venueId || !eventDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      // Determine the event title
      let eventTitle: string;

      if (hasCustomTitle && customTitle.trim()) {
        // Use custom title if checkbox is checked and title is provided
        eventTitle = customTitle.trim();
      } else {
        // Auto-generate title from headliner @ venue
        const [headlinerRes, venueRes] = await Promise.all([
          supabase
            .from('artists')
            .select('name')
            .eq('id', headlinerId)
            .maybeSingle(),
          supabase
            .from('venues' as any)
            .select('name')
            .eq('id', venueId)
            .maybeSingle(),
        ]);

        eventTitle =
          headlinerRes.data && venueRes.data
            ? `${(headlinerRes.data as any).name} @ ${(venueRes.data as any).name}`
            : (headlinerRes.data as any)?.name || 'Event';
      }

      const { error } = await supabase
        .from('events')
        .update({
          title: eventTitle,
          headliner_id: headlinerId,
          venue_id: venueId,
          start_time: eventDate.toISOString(),
          end_time: isAfterHours ? null : endTime,
          is_after_hours: isAfterHours,
        })
        .eq('id', id!);

      if (error) throw error;

      toast.success('Overview updated successfully');
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    } catch (error) {
      await handleError(error, {
        title: 'Failed to Update Overview',
        description: 'Could not save event overview changes',
        endpoint: 'EventManagement/overview',
        method: 'UPDATE',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!id || !event) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"?\n\nThis action cannot be undone. All ticket tiers and orders associated with this event will also be deleted.`
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
      onItemChange={setActiveTab}
      showDividers
      showBackButton
      onBack={() => navigate(`/event/${id}`)}
      backButtonLabel='Event Details'
      mobileTabBar={
        <MobileBottomTabBar
          tabs={mobileTabs}
          activeTab={activeTab}
          onTabChange={tab => setActiveTab(tab as EventTab)}
        />
      }
    >
      <div className='max-w-full'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-foreground'>
            {event.title}
          </h1>
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
                    loading={isSaving}
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
                      value={headlinerId}
                      onChange={setHeadlinerId}
                      placeholder='Select headliner'
                    />
                  </div>

                  {/* Venue */}
                  <div className='space-y-2'>
                    <Label htmlFor='venue'>
                      Venue <span className='text-destructive'>*</span>
                    </Label>
                    <FmVenueSearchDropdown
                      value={venueId}
                      onChange={setVenueId}
                      placeholder='Select venue'
                    />
                  </div>

                  {/* Custom Event Title */}
                  <div className='space-y-2 md:col-span-2'>
                    <div className='flex items-center gap-2 mb-2'>
                      <Checkbox
                        id='custom-title'
                        checked={hasCustomTitle}
                        onCheckedChange={checked =>
                          setHasCustomTitle(!!checked)
                        }
                      />
                      <Label htmlFor='custom-title' className='cursor-pointer'>
                        Provide event title
                      </Label>
                    </div>
                    {hasCustomTitle && (
                      <Input
                        id='event-title'
                        value={customTitle}
                        onChange={e => setCustomTitle(e.target.value)}
                        placeholder='Enter custom event title'
                      />
                    )}
                    {!hasCustomTitle && (
                      <p className='text-sm text-muted-foreground'>
                        Event title will be auto-generated as "Headliner @
                        Venue"
                      </p>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div className='space-y-2'>
                    <Label>
                      Event Date & Time{' '}
                      <span className='text-destructive'>*</span>
                    </Label>
                    <div className='flex gap-2'>
                      <FmCommonDatePicker
                        value={eventDate}
                        onChange={setEventDate}
                      />
                      <FmCommonTimePicker
                        value={eventDate ? format(eventDate, 'HH:mm') : '20:00'}
                        onChange={(time: string) => {
                          if (eventDate) {
                            const [hours, minutes] = time.split(':');
                            const newDate = new Date(eventDate);
                            newDate.setHours(
                              parseInt(hours),
                              parseInt(minutes)
                            );
                            setEventDate(newDate);
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
                        value={endTime}
                        onChange={setEndTime}
                        disabled={isAfterHours}
                      />
                      <div className='flex items-center gap-2'>
                        <Checkbox
                          id='after-hours'
                          checked={isAfterHours}
                          onCheckedChange={checked =>
                            setIsAfterHours(!!checked)
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
                      currentImageUrl={heroImage}
                      isPrimary={true}
                      onUploadComplete={(publicUrl: string) => {
                        setHeroImage(publicUrl);
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'artists' && (
            <EventArtistManagement
              headlinerId={event.headliner_id || ''}
              undercardIds={[]}
              onChange={data => handleEventUpdate(data)}
            />
          )}

          {activeTab === 'tiers' && (
            <div className='rounded-none border border-border bg-card p-8 text-center'>
              <Ticket className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-foreground mb-2'>
                Ticket Tier Management
              </h3>
              <p className='text-muted-foreground'>
                Ticket tier management interface coming soon
              </p>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className='rounded-none border border-border bg-card p-8 text-center'>
              <ShoppingBag className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-foreground mb-2'>
                Order Management
              </h3>
              <p className='text-muted-foreground'>
                Order management coming soon
              </p>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className='rounded-none border border-border bg-card p-8 text-center'>
              <DollarSign className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-foreground mb-2'>
                Sales Summary
              </h3>
              <p className='text-muted-foreground'>
                Sales analytics coming soon
              </p>
            </div>
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
