import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { FmCommonFormModal } from '@/components/ui/FmCommonFormModal';
import { FmCommonModal } from '@/components/ui/FmCommonModal';
import { FmArtistSearchDropdown } from '@/components/ui/FmArtistSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/ui/FmVenueSearchDropdown';
import { FmCommonEventDatePicker } from '@/components/ui/FmCommonEventDatePicker';
import { FmCommonTimePicker } from '@/components/ui/FmCommonTimePicker';
import { FmCommonRowManager } from '@/components/ui/FmCommonRowManager';
import { FmCommonLoadingSpinner } from '@/components/ui/FmCommonLoadingSpinner';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from '@/components/ui/FmCommonToast';
import { cn } from '@/shared/utils/utils';

interface UndercardArtist {
  artistId: string;
}

interface TicketTier {
  name: string;
  priceInCents: number;
  quantity: number;
  hideUntilPreviousSoldOut: boolean;
}

interface FmCreateEventButtonProps {
  onModalOpen?: () => void;
  onEventCreated?: (eventId: string) => void;
  variant?: 'default' | 'outline';
  className?: string;
}

export const FmCreateEventButton = ({
  onModalOpen,
  onEventCreated,
  variant = 'outline',
  className,
}: FmCreateEventButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdEventTitle, setCreatedEventTitle] = useState('');
  const [headlinerId, setHeadlinerId] = useState<string>('');
  const [eventDate, setEventDate] = useState<Date>();
  const [endTime, setEndTime] = useState<string>('02:00');
  const [isAfterHours, setIsAfterHours] = useState(false);
  const [venueId, setVenueId] = useState<string>('');
  const [venueCapacity, setVenueCapacity] = useState<number>(0);
  const [undercardArtists, setUndercardArtists] = useState<UndercardArtist[]>([]);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);

  // Fetch venue capacity when venue changes
  useEffect(() => {
    if (venueId) {
      supabase
        .from('venues' as any)
        .select('capacity')
        .eq('id', venueId)
        .single()
        .then(({ data }: any) => {
          if (data && data.capacity) {
            setVenueCapacity(data.capacity);
            // Initialize default tiers
            const capacity = data.capacity;
            const tierCapacity = Math.floor(capacity / 3);
            const remainder = capacity % 3;
            
            setTicketTiers([
              { 
                name: 'GA1', 
                priceInCents: 0, 
                quantity: tierCapacity + (remainder > 0 ? 1 : 0), 
                hideUntilPreviousSoldOut: false 
              },
              { 
                name: 'GA2', 
                priceInCents: 0, 
                quantity: tierCapacity + (remainder > 1 ? 1 : 0), 
                hideUntilPreviousSoldOut: false 
              },
              { 
                name: 'GA3', 
                priceInCents: 0, 
                quantity: tierCapacity, 
                hideUntilPreviousSoldOut: false 
              },
            ]);
          }
        });
    }
  }, [venueId]);

  const handleCreateEvent = () => {
    setIsModalOpen(true);
    onModalOpen?.();
  };

  const handleSubmit = async () => {
    // Close modal and show loading overlay
    setIsModalOpen(false);
    setIsLoading(true);

    try {
      // Format the date and time for the database
      const eventDateString = eventDate ? format(eventDate, 'yyyy-MM-dd') : null;
      const eventTimeString = eventDate ? format(eventDate, 'HH:mm') : null;

      // Insert the event
      const { data: newEvent, error: eventError } = await supabase
        .from('events' as any)
        .insert({
          title: `${headlinerId ? 'Event' : 'New Event'}`, // TODO: Get actual artist name
          headliner_id: headlinerId || null,
          venue_id: venueId || null,
          date: eventDateString,
          time: eventTimeString,
          end_time: isAfterHours ? null : endTime,
          is_after_hours: isAfterHours,
          undercard_ids: undercardArtists.map(a => a.artistId).filter(Boolean),
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create ticket tiers for the event
      if (ticketTiers.length > 0 && newEvent) {
        const tiersToInsert = ticketTiers.map((tier, index) => ({
          event_id: (newEvent as any).id,
          name: tier.name || `Tier ${index + 1}`,
          price_cents: tier.priceInCents,
          total_tickets: tier.quantity,
          available_inventory: tier.quantity,
          reserved_inventory: 0,
          sold_inventory: 0,
          tier_order: index,
          hide_until_previous_sold_out: tier.hideUntilPreviousSoldOut,
          is_active: true,
          fee_flat_cents: 0,
          fee_pct_bps: 0,
        }));

        const { error: tiersError } = await supabase
          .from('ticket_tiers' as any)
          .insert(tiersToInsert);

        if (tiersError) throw tiersError;
      }

      onEventCreated?.((newEvent as any).id);
      
      // Hide loading and show success modal
      setIsLoading(false);
      setShowSuccessModal(true);
      setCreatedEventTitle((newEvent as any).title || 'Event');
      
      // Reset form
      setHeadlinerId('');
      setEventDate(undefined);
      setEndTime('02:00');
      setIsAfterHours(false);
      setVenueId('');
      setVenueCapacity(0);
      setUndercardArtists([]);
      setTicketTiers([]);
    } catch (error) {
      console.error('Error creating event:', error);
      setIsLoading(false);
      toast.error('Failed to create event', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    // Reset form
    setHeadlinerId('');
    setEventDate(undefined);
    setEndTime('02:00');
    setIsAfterHours(false);
    setVenueId('');
    setVenueCapacity(0);
    setUndercardArtists([]);
    setTicketTiers([]);
  };

  const totalTickets = ticketTiers.reduce((sum, tier) => sum + tier.quantity, 0);
  const ticketsOverCapacity = totalTickets > venueCapacity;
  const ticketsUnderCapacity = totalTickets < venueCapacity;

  const getTicketStatusMessage = () => {
    if (!venueCapacity) return '';
    if (ticketsOverCapacity) {
      return `Over capacity by ${totalTickets - venueCapacity} tickets`;
    }
    if (ticketsUnderCapacity) {
      return `${venueCapacity - totalTickets} tickets remaining`;
    }
    return 'All tickets allocated';
  };

  return (
    <>
      <Button
        onClick={handleCreateEvent}
        variant={variant}
        className={cn(
          'justify-start gap-2',
          variant === 'outline' && 'bg-white/5 border-white/30 hover:bg-fm-gold/20 hover:border-fm-gold hover:text-fm-gold transition-all',
          className
        )}
      >
        <Plus className="h-4 w-4" />
        Create Event
      </Button>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4">
            <FmCommonLoadingSpinner size="lg" />
            <p className="text-white/70 text-sm">Creating event...</p>
          </div>
        </div>
      )}

      <FmCommonModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        title="Event Created"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-white/80 text-center">
            <span className="font-semibold text-fm-gold">{createdEventTitle}</span> has been successfully created!
          </p>
          <Button
            onClick={() => setShowSuccessModal(false)}
            className="w-full bg-fm-gold hover:bg-fm-gold/90 text-black"
          >
            Done
          </Button>
        </div>
      </FmCommonModal>

      <FmCommonFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Create New Event"
        description="Set up a new event with ticket tiers and details"
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        sections={[
          {
            title: 'Event Details',
            content: (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Headliner</Label>
                  <FmArtistSearchDropdown
                    value={headlinerId}
                    onChange={setHeadlinerId}
                    placeholder="Search for headliner artist..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Date & Time</Label>
                  <FmCommonEventDatePicker
                    value={eventDate}
                    onChange={setEventDate}
                    placeholder="Select event date and time"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">End Time</Label>
                    <FmCommonTimePicker
                      value={endTime}
                      onChange={setEndTime}
                      disabled={isAfterHours}
                      placeholder="Select end time"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white opacity-0">Checkbox</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Checkbox
                        id="after-hours"
                        checked={isAfterHours}
                        onCheckedChange={(checked) => setIsAfterHours(checked === true)}
                      />
                      <Label htmlFor="after-hours" className="text-white/70 cursor-pointer">
                        After Hours
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Venue</Label>
                  <FmVenueSearchDropdown
                    value={venueId}
                    onChange={setVenueId}
                    placeholder="Search for venue..."
                  />
                </div>
              </div>
            ),
          },
          {
            title: 'Undercard Artists',
            content: (
              <FmCommonRowManager
                items={undercardArtists}
                onAdd={() => setUndercardArtists([...undercardArtists, { artistId: '' }])}
                onRemove={(index) => setUndercardArtists(undercardArtists.filter((_, i) => i !== index))}
                addLabel="Add Undercard Artist"
                minItems={0}
                maxItems={5}
                renderRow={(item, index) => (
                  <FmArtistSearchDropdown
                    value={item.artistId}
                    onChange={(id) => {
                      const updated = [...undercardArtists];
                      updated[index].artistId = id;
                      setUndercardArtists(updated);
                    }}
                    placeholder="Search for undercard artist..."
                  />
                )}
              />
            ),
          },
          {
            title: 'Ticket Tiers',
            content: (
              <div className="space-y-3">
                <FmCommonRowManager
                  items={ticketTiers}
                  onAdd={() =>
                    setTicketTiers([
                      ...ticketTiers,
                      { name: '', priceInCents: 0, quantity: 0, hideUntilPreviousSoldOut: false },
                    ])
                  }
                  onRemove={(index) => setTicketTiers(ticketTiers.filter((_, i) => i !== index))}
                  addLabel="Add Ticket Tier"
                  minItems={1}
                  maxItems={5}
                  renderRow={(tier, index) => (
                    <div className="space-y-3 p-4 rounded-md bg-white/5 border border-white/10">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-white/70 text-xs">Name</Label>
                          <Input
                            value={tier.name}
                            onChange={(e) => {
                              const updated = [...ticketTiers];
                              updated[index].name = e.target.value;
                              setTicketTiers(updated);
                            }}
                            placeholder="e.g., General Admission"
                            className="bg-black/40 border-white/20 text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-white/70 text-xs">Price ($)</Label>
                          <Input
                            type="number"
                            value={tier.priceInCents / 100}
                            onChange={(e) => {
                              const updated = [...ticketTiers];
                              updated[index].priceInCents = Math.round(parseFloat(e.target.value || '0') * 100);
                              setTicketTiers(updated);
                            }}
                            placeholder="0.00"
                            step="0.01"
                            className="bg-black/40 border-white/20 text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-white/70 text-xs">Quantity</Label>
                          <Input
                            type="number"
                            value={tier.quantity}
                            onChange={(e) => {
                              const updated = [...ticketTiers];
                              updated[index].quantity = parseInt(e.target.value || '0');
                              setTicketTiers(updated);
                            }}
                            placeholder="0"
                            className="bg-black/40 border-white/20 text-white"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`tier-${index}-hide`}
                          checked={tier.hideUntilPreviousSoldOut}
                          onCheckedChange={(checked) => {
                            const updated = [...ticketTiers];
                            updated[index].hideUntilPreviousSoldOut = checked === true;
                            setTicketTiers(updated);
                          }}
                        />
                        <Label htmlFor={`tier-${index}-hide`} className="text-white/70 text-sm cursor-pointer">
                          Hide until previous tier sold out
                        </Label>
                      </div>
                    </div>
                  )}
                />
                {venueCapacity > 0 && (
                  <div className="flex items-center justify-between text-sm pt-2">
                    <span className={cn(
                      'text-white/70',
                      ticketsOverCapacity && 'text-fm-crimson',
                    )}>
                      {getTicketStatusMessage()}
                    </span>
                    <span className={cn(
                      'font-semibold',
                      ticketsUnderCapacity && 'text-white/50',
                      ticketsOverCapacity && 'text-fm-crimson',
                      !ticketsUnderCapacity && !ticketsOverCapacity && 'text-fm-gold'
                    )}>
                      {totalTickets} / {venueCapacity}
                    </span>
                  </div>
                )}
              </div>
            ),
          },
        ]}
        actions={
          <div className="flex gap-3">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1 border-white/20 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-fm-gold hover:bg-fm-gold/90 text-black"
            >
              Create Event
            </Button>
          </div>
        }
      />
    </>
  );
};
