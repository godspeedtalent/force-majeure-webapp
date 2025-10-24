import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FmCommonFormModal } from '@/components/ui/FmCommonFormModal';
import { FmArtistSearchDropdown } from '@/components/ui/FmArtistSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/ui/FmVenueSearchDropdown';
import { FmCommonEventDatePicker } from '@/components/ui/FmCommonEventDatePicker';
import { FmCommonRowManager } from '@/components/ui/FmCommonRowManager';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/shared/api/supabase/client';
import { cn } from '@/shared/utils/utils';
import { useDevTools } from '@/contexts/DevToolsContext';

interface UndercardArtist {
  artistId: string;
}

interface TicketTier {
  name: string;
  priceInCents: number;
  quantity: number;
  hideUntilPreviousSoldOut: boolean;
}

export const CreationToolsSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [headlinerId, setHeadlinerId] = useState<string>('');
  const [eventDate, setEventDate] = useState<Date>();
  const [venueId, setVenueId] = useState<string>('');
  const [venueCapacity, setVenueCapacity] = useState<number>(0);
  const [undercardArtists, setUndercardArtists] = useState<UndercardArtist[]>([]);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const { isDrawerOpen, toggleDrawer } = useDevTools();

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
    // Auto-collapse the dev tools drawer when opening modal
    if (isDrawerOpen) {
      toggleDrawer();
    }
  };

  const handleSubmit = () => {
    console.log('Creating event:', {
      headlinerId,
      eventDate,
      venueId,
      undercardArtists,
      ticketTiers,
    });
    // TODO: Implement event creation
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    // Reset form
    setHeadlinerId('');
    setEventDate(undefined);
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
      <div className="space-y-4">
        <Button
          onClick={handleCreateEvent}
          variant="outline"
          className="w-full justify-start gap-2 bg-white/5 border-white/30 hover:bg-fm-gold/20 hover:border-fm-gold hover:text-fm-gold transition-all"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>

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
