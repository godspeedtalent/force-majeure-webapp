import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, FileText, Ticket, DollarSign, ShoppingBag } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FmArtistSearchDropdown } from '@/components/ui/FmArtistSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/ui/FmVenueSearchDropdown';
import { FmCommonDatePicker } from '@/components/ui/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/ui/FmCommonTimePicker';
import { FormSection } from '@/components/ui/FormSection';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { TopographicBackground } from '@/components/ui/TopographicBackground';
import { DecorativeDivider } from '@/components/DecorativeDivider';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/shared/utils/utils';

interface TicketTier {
  id?: string;
  name: string;
  description: string;
  price_cents: number;
  total_tickets: number;
  tier_order: number;
  hide_until_previous_sold_out: boolean;
}

type EventTab = 'overview' | 'ticketing' | 'sales' | 'orders';

function EventEditSidebar({ activeTab, setActiveTab }: { activeTab: EventTab; setActiveTab: (tab: EventTab) => void }) {
  const { open, toggleSidebar } = useSidebar();

  const eventTabs = [
    { id: 'overview' as EventTab, label: 'Overview', icon: FileText },
    { id: 'ticketing' as EventTab, label: 'Ticketing', icon: Ticket },
    { id: 'sales' as EventTab, label: 'Sales', icon: DollarSign },
    { id: 'orders' as EventTab, label: 'Orders', icon: ShoppingBag },
  ];

  return (
    <Sidebar className="border-r border-white/20 bg-black/40" collapsible="icon">
      <SidebarContent className="pt-4">
        <div className="px-2 mb-4">
          <SidebarTrigger className="hover:bg-fm-gold/20 transition-colors" />
        </div>

        <SidebarGroup>
          {open && (
            <SidebarGroupLabel
              className="text-white/90 px-4 flex items-center gap-2 cursor-pointer hover:bg-white/5 transition-colors rounded-md text-base font-semibold mb-1"
              onClick={toggleSidebar}
            >
              <Edit className="h-4 w-4" />
              Event Details
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {eventTabs.map((tab) => (
                <SidebarMenuItem key={tab.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'cursor-pointer transition-colors',
                      open ? 'justify-start pl-4' : 'justify-center',
                      activeTab === tab.id && 'bg-fm-gold/20 text-fm-gold hover:bg-fm-gold/30'
                    )}
                    tooltip={tab.label}
                  >
                    <tab.icon className="h-4 w-4" />
                    {open && <span className="ml-3">{tab.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function EventEdit() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<EventTab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAfterHours, setIsAfterHours] = useState(false);
  const [heroImage, setHeroImage] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [headlinerId, setHeadlinerId] = useState<string>('');
  const [undercardIds, setUndercardIds] = useState<string[]>([]);
  const [venueId, setVenueId] = useState<string>('');
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([
    {
      name: 'General Admission',
      description: '',
      price_cents: 0,
      total_tickets: 0,
      tier_order: 1,
      hide_until_previous_sold_out: false,
    },
  ]);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    if (!eventId) return;
    
    try {
      setIsFetching(true);
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      if (event) {
        setTitle(event.title);
        setDescription(event.description || '');
        setDate(new Date(event.date));
        setTime(event.time);
        setEndTime(event.end_time || '');
        setIsAfterHours(event.is_after_hours || false);
        setHeroImage(event.hero_image || '');
        setTicketUrl(event.ticket_url || '');
        setHeadlinerId(event.headliner_id || '');
        setUndercardIds(event.undercard_ids || []);
        setVenueId(event.venue_id || '');

        const { data: tiers } = await supabase
          .from('ticket_tiers')
          .select('*')
          .eq('event_id', eventId)
          .order('tier_order');

        if (tiers && tiers.length > 0) {
          setTicketTiers(
            tiers.map((tier) => ({
              id: tier.id,
              name: tier.name,
              description: tier.description || '',
              price_cents: tier.price_cents,
              total_tickets: tier.total_tickets,
              tier_order: tier.tier_order,
              hide_until_previous_sold_out: tier.hide_until_previous_sold_out,
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddTicketTier = () => {
    setTicketTiers([
      ...ticketTiers,
      {
        name: '',
        description: '',
        price_cents: 0,
        total_tickets: 0,
        tier_order: ticketTiers.length + 1,
        hide_until_previous_sold_out: false,
      },
    ]);
  };

  const handleRemoveTicketTier = (index: number) => {
    if (ticketTiers.length === 1) {
      toast.error('Must have at least one ticket tier');
      return;
    }
    const newTiers = ticketTiers.filter((_, i) => i !== index);
    setTicketTiers(newTiers.map((tier, i) => ({ ...tier, tier_order: i + 1 })));
  };

  const handleUpdateTicketTier = (index: number, field: keyof TicketTier, value: any) => {
    const newTiers = [...ticketTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTicketTiers(newTiers);
  };

  const handleSubmit = async () => {
    if (!eventId) return;
    if (!title || !date || !time || !headlinerId || !venueId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const { error: eventError } = await supabase
        .from('events')
        .update({
          title,
          description,
          date: date.toISOString().split('T')[0],
          time,
          end_time: endTime || null,
          is_after_hours: isAfterHours,
          hero_image: heroImage || null,
          ticket_url: ticketUrl || null,
          headliner_id: headlinerId,
          undercard_ids: undercardIds,
          venue_id: venueId,
        })
        .eq('id', eventId);

      if (eventError) throw eventError;

      const { error: deleteError } = await supabase
        .from('ticket_tiers')
        .delete()
        .eq('event_id', eventId);

      if (deleteError) throw deleteError;

      const tiersToInsert = ticketTiers.map((tier, index) => ({
        event_id: eventId,
        name: tier.name,
        description: tier.description || null,
        price_cents: tier.price_cents,
        total_tickets: tier.total_tickets,
        available_inventory: tier.total_tickets,
        tier_order: index + 1,
        hide_until_previous_sold_out: tier.hide_until_previous_sold_out,
      }));

      const { error: insertError } = await supabase
        .from('ticket_tiers')
        .insert(tiersToInsert);

      if (insertError) throw insertError;

      toast.success('Event updated successfully!');
      navigate('/demo/event-checkout');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setIsLoading(false);
    }
  };

  const getTabTitle = () => {
    if (activeTab === 'overview') return 'Overview';
    if (activeTab === 'ticketing') return 'Ticketing';
    if (activeTab === 'sales') return 'Sales';
    if (activeTab === 'orders') return 'Orders';
    return 'Event Details';
  };

  if (isFetching) {
    return (
      <>
        <Navigation />
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full pt-16">
            <EventEditSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="flex-1 pt-6 pb-6 px-6 relative overflow-hidden">
              <TopographicBackground />
              <div className="flex items-center justify-center py-12 relative z-10">
                <div className="text-muted-foreground">Loading event details...</div>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full pt-16">
          <EventEditSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="flex-1 pt-6 pb-6 px-6 relative overflow-hidden">
            <TopographicBackground />
            <div className="max-w-full relative z-10">
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <Edit className="h-6 w-6 text-fm-gold" />
                  <h1 className="text-3xl font-canela font-bold">{title || getTabTitle()}</h1>
                </div>
              </div>

              <DecorativeDivider
                marginTop="mt-0"
                marginBottom="mb-6"
                lineWidth="w-32"
                opacity={0.5}
              />

              {activeTab === 'overview' && (
                <div className="max-w-4xl space-y-6">
        <FormSection title="Basic Information">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter event title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <FmCommonDatePicker value={date} onChange={setDate} />
              </div>
              <div>
                <Label>Start Time *</Label>
                <FmCommonTimePicker value={time} onChange={setTime} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>End Time</Label>
                <FmCommonTimePicker value={endTime} onChange={setEndTime} />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="after-hours"
                  checked={isAfterHours}
                  onCheckedChange={setIsAfterHours}
                />
                <Label htmlFor="after-hours">After Hours Event</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="hero-image">Hero Image URL</Label>
              <Input
                id="hero-image"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="ticket-url">External Ticket URL</Label>
              <Input
                id="ticket-url"
                value={ticketUrl}
                onChange={(e) => setTicketUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </FormSection>

        <Separator />

        <FormSection title="Artists & Venue">
          <div className="space-y-4">
            <div>
              <Label>Headliner *</Label>
              <FmArtistSearchDropdown
                value={headlinerId}
                onChange={setHeadlinerId}
              />
            </div>

            <div>
              <Label>Undercard Artists</Label>
              <FmArtistSearchDropdown
                value={undefined}
                onChange={(id: string) => {
                  if (id && !undercardIds.includes(id)) {
                    setUndercardIds([...undercardIds, id]);
                  }
                }}
                placeholder="Add undercard artist"
              />
              {undercardIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {undercardIds.map((id) => (
                    <div
                      key={id}
                      className="bg-muted px-2 py-1 rounded text-xs flex items-center gap-1"
                    >
                      <span>{id}</span>
                      <button
                        onClick={() => setUndercardIds(undercardIds.filter((uid) => uid !== id))}
                        className="text-destructive hover:text-destructive/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Venue *</Label>
              <FmVenueSearchDropdown value={venueId} onChange={setVenueId} />
            </div>
          </div>
        </FormSection>

                </div>
              )}

              {activeTab === 'ticketing' && (
                <div className="max-w-4xl space-y-6">
                  <FormSection title="Ticket Tiers">
          <div className="space-y-6">
            {ticketTiers.map((tier, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Tier {index + 1}</h4>
                  {ticketTiers.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveTicketTier(index)}
                      className="text-destructive"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tier Name</Label>
                    <Input
                      value={tier.name}
                      onChange={(e) => handleUpdateTicketTier(index, 'name', e.target.value)}
                      placeholder="e.g., General Admission"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={tier.description}
                      onChange={(e) =>
                        handleUpdateTicketTier(index, 'description', e.target.value)
                      }
                      placeholder="Optional description"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={(tier.price_cents / 100).toFixed(2)}
                      onChange={(e) =>
                        handleUpdateTicketTier(
                          index,
                          'price_cents',
                          Math.round(parseFloat(e.target.value || '0') * 100)
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Total Tickets</Label>
                    <Input
                      type="number"
                      value={tier.total_tickets}
                      onChange={(e) =>
                        handleUpdateTicketTier(index, 'total_tickets', parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={tier.hide_until_previous_sold_out}
                    onCheckedChange={(checked) =>
                      handleUpdateTicketTier(index, 'hide_until_previous_sold_out', checked)
                    }
                  />
                  <Label>Hide until previous tier sells out</Label>
                </div>
              </div>
            ))}

            <Button onClick={handleAddTicketTier} variant="outline" className="w-full">
              Add Ticket Tier
            </Button>
          </div>
        </FormSection>

                  <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => navigate('/demo/event-checkout')}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-fm-gold hover:bg-fm-gold/90 text-black"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  </div>
                </div>
              )}

              {activeTab === 'sales' && (
                <div className="text-center py-12 text-muted-foreground">
                  Sales analytics coming soon
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="text-center py-12 text-muted-foreground">
                  Orders management coming soon
                </div>
              )}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}
