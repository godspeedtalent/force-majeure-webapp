import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, Users, Ticket, DollarSign, ShoppingBag, Calendar, Save, BarChart3, Shield, Trash2 } from 'lucide-react';
import { supabase } from '@/shared/api/supabase/client';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/ui/navigation/FmCommonSideNav';
import { FmCommonButton } from '@/components/ui/buttons/FmCommonButton';
import { EventArtistManagement } from '@/components/events/artists/EventArtistManagement';
import { TicketingPanel } from '@/features/events/components/TicketingPanel';
import { toast } from 'sonner';
import { Card } from '@/components/ui/shadcn/card';
import { FmVenueSearchDropdown } from '@/components/ui/search/FmVenueSearchDropdown';
import { FmArtistSearchDropdown } from '@/components/ui/search/FmArtistSearchDropdown';
import { FmCommonDatePicker } from '@/components/ui/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/ui/forms/FmCommonTimePicker';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { format, parse } from 'date-fns';
import { useAuth } from '@/features/auth/services/AuthContext';

type EventTab = 'overview' | 'artists' | 'tiers' | 'orders' | 'sales' | 'admin';

export default function EventManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
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

  // Fetch event data
  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      if (!id) throw new Error('No event ID provided');

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          venues(id, name),
          artists!events_headliner_id_fkey(id, name)
        `)
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
      setHeroImage(event.hero_image || '');

      // Parse date and time
      if (event.date) {
        const dateStr = event.date;
        const timeStr = event.time || '20:00';
        const [hours, minutes] = timeStr.split(':');
        const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
        parsedDate.setHours(parseInt(hours), parseInt(minutes));
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
        { id: 'overview', label: 'Overview', icon: FileText, description: 'Basic event information' },
        { id: 'artists', label: 'Artists', icon: Users, description: 'Manage lineup and scheduling' },
      ],
    },
    {
      label: 'Ticketing',
      icon: Ticket,
      items: [
        { id: 'tiers', label: 'Tier Management', icon: Ticket, description: 'Manage ticket tiers and pricing' },
        { id: 'orders', label: 'Orders', icon: ShoppingBag, description: 'View and manage orders' },
      ],
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      items: [
        { id: 'sales', label: 'Sales Summary', icon: DollarSign, description: 'Revenue and sales analytics' },
      ],
    },
    ...(isAdmin ? [{
      label: 'Admin',
      icon: Shield,
      items: [
        { id: 'admin' as EventTab, label: 'Admin Controls', icon: Shield, description: 'Advanced event controls' },
      ],
    }] : []),
  ];

  const handleEventUpdate = async (updates: any) => {
    try {
      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Event updated successfully');
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  const handleSaveOverview = async () => {
    if (!headlinerId || !venueId || !eventDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      // Fetch headliner and venue for title generation
      const [headlinerRes, venueRes] = await Promise.all([
        supabase.from('artists').select('name').eq('id', headlinerId).single(),
        supabase.from('venues').select('name').eq('id', venueId).single(),
      ]);

      const eventTitle = headlinerRes.data && venueRes.data
        ? `${headlinerRes.data.name} @ ${venueRes.data.name}`
        : headlinerRes.data?.name || 'Event';

      const eventDateString = format(eventDate, 'yyyy-MM-dd');
      const eventTimeString = format(eventDate, 'HH:mm');

      const { error } = await supabase
        .from('events')
        .update({
          title: eventTitle,
          headliner_id: headlinerId,
          venue_id: venueId,
          date: eventDateString,
          time: eventTimeString,
          end_time: isAfterHours ? null : endTime,
          is_after_hours: isAfterHours,
          hero_image: heroImage || null,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Overview updated successfully');
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    } catch (error) {
      console.error('Error updating overview:', error);
      toast.error('Failed to update overview');
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

      toast.success('Event deleted successfully');

      // Navigate back to admin or home
      navigate('/admin');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopographicBackground />
        <Navigation />
        <div className="container mx-auto py-8">
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <TopographicBackground />
        <Navigation />
        <div className="container mx-auto py-8">
          <p className="text-muted-foreground">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={setActiveTab}
      showDividers
    >
      <div className="max-w-full">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <FmCommonButton
                  variant="ghost"
                  icon={ArrowLeft}
                  onClick={() => navigate(`/event/${id}`)}
                >
                  Back to Event
                </FmCommonButton>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
                  <p className="text-muted-foreground">Event Management</p>
                </div>
              </div>

              {/* Main Content */}
              <div className="space-y-6">
              {activeTab === 'overview' && (
                <Card className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                          Event Overview
                        </h2>
                        <p className="text-muted-foreground">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Headliner */}
                      <div className="space-y-2">
                        <Label htmlFor="headliner">
                          Headliner <span className="text-destructive">*</span>
                        </Label>
                        <FmArtistSearchDropdown
                          artistId={headlinerId}
                          onArtistChange={setHeadlinerId}
                          placeholder="Select headliner"
                        />
                      </div>

                      {/* Venue */}
                      <div className="space-y-2">
                        <Label htmlFor="venue">
                          Venue <span className="text-destructive">*</span>
                        </Label>
                        <FmVenueSearchDropdown
                          venueId={venueId}
                          onVenueChange={setVenueId}
                          placeholder="Select venue"
                        />
                      </div>

                      {/* Date & Time */}
                      <div className="space-y-2">
                        <Label>
                          Event Date & Time <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <FmCommonDatePicker
                            date={eventDate}
                            onDateChange={setEventDate}
                          />
                          <FmCommonTimePicker
                            time={eventDate ? format(eventDate, 'HH:mm') : '20:00'}
                            onTimeChange={(time) => {
                              if (eventDate) {
                                const [hours, minutes] = time.split(':');
                                const newDate = new Date(eventDate);
                                newDate.setHours(parseInt(hours), parseInt(minutes));
                                setEventDate(newDate);
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* End Time */}
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <div className="flex items-center gap-4">
                          <FmCommonTimePicker
                            time={endTime}
                            onTimeChange={setEndTime}
                            disabled={isAfterHours}
                          />
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="after-hours"
                              checked={isAfterHours}
                              onCheckedChange={(checked) => setIsAfterHours(!!checked)}
                            />
                            <Label htmlFor="after-hours" className="cursor-pointer">
                              After hours
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Hero Image URL */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="hero-image">Hero Image URL</Label>
                        <Input
                          id="hero-image"
                          value={heroImage}
                          onChange={(e) => setHeroImage(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {activeTab === 'artists' && (
                <EventArtistManagement
                  headlinerId={event.headliner_id || ''}
                  undercardIds={event.undercard_ids || []}
                  onChange={(data) => handleEventUpdate(data)}
                />
              )}

              {activeTab === 'tiers' && (
                <TicketingPanel eventId={id!} />
              )}

              {activeTab === 'orders' && (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Order Management
                  </h3>
                  <p className="text-muted-foreground">
                    Order management coming soon
                  </p>
                </div>
              )}

              {activeTab === 'sales' && (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Sales Summary
                  </h3>
                  <p className="text-muted-foreground">
                    Sales analytics coming soon
                  </p>
                </div>
              )}

              {activeTab === 'admin' && isAdmin && (
                <Card className="p-8">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        Admin Controls
                      </h2>
                      <p className="text-muted-foreground">
                        Advanced event management controls
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-destructive/10">
                            <Trash2 className="h-6 w-6 text-destructive" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                              Delete Event
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Permanently delete this event and all associated data including ticket tiers and orders.
                              This action cannot be undone.
                            </p>
                            <FmCommonButton
                              variant="destructive"
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
