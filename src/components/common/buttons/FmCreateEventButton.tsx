import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonCreateButton } from '@/components/common/buttons/FmCommonCreateButton';
import { FmCommonFormModal } from '@/components/common/modals/FmCommonFormModal';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/common/forms/FmCommonTimePicker';
import { FmCommonRowManager } from '@/components/common/forms/FmCommonRowManager';
import { FmCommonLoadingOverlay } from '@/components/common/feedback/FmCommonLoadingOverlay';
import { Input } from '@/components/common/shadcn/input';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { Label } from '@/components/common/shadcn/label';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from '@/components/common/feedback/FmCommonToast';
import { cn } from '@/shared/utils/utils';

interface UndercardArtist {
  artistId: string;
}

interface TicketTier {
  name: string;
  description?: string;
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
  const [headlinerId, setHeadlinerId] = useState<string>('');
  const [eventDate, setEventDate] = useState<Date>();
  const [endTime, setEndTime] = useState<string>('02:00');
  const [isAfterHours, setIsAfterHours] = useState(false);
  const [venueId, setVenueId] = useState<string>('');
  const [venueCapacity, setVenueCapacity] = useState<number>(0);
  const [undercardArtists, setUndercardArtists] = useState<UndercardArtist[]>([]);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [heroImage, setHeroImage] = useState<string>('');

  // Fetch venue capacity when venue changes
  useEffect(() => {
    if (venueId) {
      supabase
        .from('venues' as any)
        .select('capacity')
        .eq('id', venueId)
        .single()
        .then(({ data, error }: any) => {
          if (error) {
            console.error('Error fetching venue capacity:', error);
            toast.error('Failed to fetch venue capacity', {
              description: 'Using default capacity of 100',
            });
            setVenueCapacity(100);
            return;
          }
          
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

  // Reset form helper
  const resetForm = useCallback(() => {
    setHeadlinerId('');
    setEventDate(undefined);
    setEndTime('02:00');
    setIsAfterHours(false);
    setVenueId('');
    setVenueCapacity(0);
    setUndercardArtists([]);
    setTicketTiers([]);
    setHeroImage('');
  }, []);

  const handleCreateEvent = () => {
    setIsModalOpen(true);
    onModalOpen?.();
  };

  const validateForm = (): string | null => {
    if (!headlinerId) {
      return 'Please select a headliner';
    }
    if (!eventDate) {
      return 'Please select an event date';
    }
    if (!venueId) {
      return 'Please select a venue';
    }
    if (ticketTiers.length === 0) {
      return 'Please add at least one ticket tier';
    }
    
    // Validate ticket tiers
    for (let i = 0; i < ticketTiers.length; i++) {
      const tier = ticketTiers[i];
      if (!tier.name || tier.name.trim() === '') {
        return `Ticket tier ${i + 1} must have a name`;
      }
      if (tier.priceInCents < 0) {
        return `Ticket tier "${tier.name}" cannot have a negative price`;
      }
      if (tier.quantity <= 0) {
        return `Ticket tier "${tier.name}" must have at least 1 ticket`;
      }
    }

    const totalTickets = ticketTiers.reduce((sum, tier) => sum + tier.quantity, 0);
    if (totalTickets > venueCapacity) {
      return `Total tickets (${totalTickets}) exceeds venue capacity (${venueCapacity})`;
    }

    return null;
  };

  const handleSubmit = async () => {
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      toast.error('Validation Error', {
        description: validationError,
      });
      return;
    }

    // Close modal and show loading overlay
    setIsModalOpen(false);
    setIsLoading(true);

    try {
      // Fetch headliner name for event title
      const { data: headliner, error: headlinerError } = await supabase
        .from('artists' as any)
        .select('name')
        .eq('id', headlinerId)
        .single();

      if (headlinerError) {
        console.error('Error fetching headliner:', headlinerError);
      }

      // Fetch venue name for event title
      const { data: venue, error: venueError } = await supabase
        .from('venues' as any)
        .select('name')
        .eq('id', venueId)
        .single();

      if (venueError) {
        console.error('Error fetching venue:', venueError);
      }

      // Construct event title
      const eventTitle = (headliner as any) && (venue as any)
        ? `${(headliner as any).name} @ ${(venue as any).name}`
        : (headliner as any)
        ? (headliner as any).name
        : 'New Event';

      // Format the date and time for the database
      const eventDateString = eventDate ? format(eventDate, 'yyyy-MM-dd') : null;
      const eventTimeString = eventDate ? format(eventDate, 'HH:mm') : null;

      // Insert the event
      const { data: newEvent, error: eventError } = await supabase
        .from('events' as any)
        .insert({
          title: eventTitle,
          headliner_id: headlinerId || null,
          venue_id: venueId || null,
          date: eventDateString,
          time: eventTimeString,
          end_time: isAfterHours ? null : endTime,
          is_after_hours: isAfterHours,
          undercard_ids: undercardArtists.map(a => a.artistId).filter(Boolean),
          hero_image: heroImage || null,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create ticket tiers for the event
      if (ticketTiers.length > 0 && newEvent) {
        const tiersToInsert = ticketTiers.map((tier, index) => ({
          event_id: (newEvent as any).id,
          name: tier.name,
          description: tier.description || null,
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
      
      // Hide loading and show success toast with auto-dismiss
      setIsLoading(false);
      toast.success('Event Created', {
        description: `${eventTitle} has been successfully created!`,
      });
      
      // Reset form
      resetForm();
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
    resetForm();
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
      <FmCommonCreateButton
        onClick={handleCreateEvent}
        label="Create Event"
        variant={variant}
        className={className}
      />

      {/* Loading Overlay */}
      {isLoading && <FmCommonLoadingOverlay message="Creating event..." />}

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
                  <Label className="text-white">Date</Label>
                  <FmCommonDatePicker
                    value={eventDate}
                    onChange={setEventDate}
                    placeholder="Select event date"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Start Time</Label>
                    <FmCommonTimePicker
                      value={eventDate ? format(eventDate, 'HH:mm') : '20:00'}
                      onChange={(time) => {
                        if (eventDate) {
                          const [hours, minutes] = time.split(':');
                          const newDate = new Date(eventDate);
                          newDate.setHours(parseInt(hours), parseInt(minutes));
                          setEventDate(newDate);
                        }
                      }}
                      placeholder="Select start time"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">End Time</Label>
                    <FmCommonTimePicker
                      value={endTime}
                      onChange={setEndTime}
                      disabled={isAfterHours}
                      placeholder="Select end time"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="after-hours"
                    checked={isAfterHours}
                    onCheckedChange={(checked) => setIsAfterHours(checked === true)}
                  />
                  <Label htmlFor="after-hours" className="text-white/70 cursor-pointer">
                    After Hours Event
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Venue</Label>
                  <FmVenueSearchDropdown
                    value={venueId}
                    onChange={setVenueId}
                    placeholder="Search for venue..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Hero Image URL</Label>
                  <Input
                    value={heroImage}
                    onChange={(e) => setHeroImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="bg-black/40 border-white/20 text-white"
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
                      { name: '', description: '', priceInCents: 0, quantity: 0, hideUntilPreviousSoldOut: false },
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
                            min="0"
                            step="1"
                            value={tier.priceInCents === 0 ? '' : (tier.priceInCents / 100).toString()}
                            onChange={(e) => {
                              const updated = [...ticketTiers];
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              updated[index].priceInCents = Math.max(0, Math.round(value * 100));
                              setTicketTiers(updated);
                            }}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="bg-black/40 border-white/20 text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-white/70 text-xs">Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={tier.quantity === 0 ? '' : tier.quantity.toString()}
                            onChange={(e) => {
                              const updated = [...ticketTiers];
                              const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                              updated[index].quantity = Math.max(1, value);
                              setTicketTiers(updated);
                            }}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="bg-black/40 border-white/20 text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70 text-xs">Description (Optional)</Label>
                        <Input
                          value={tier.description || ''}
                          onChange={(e) => {
                            const updated = [...ticketTiers];
                            updated[index].description = e.target.value;
                            setTicketTiers(updated);
                          }}
                          placeholder="e.g., Includes coat check and one drink"
                          className="bg-black/40 border-white/20 text-white"
                        />
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
