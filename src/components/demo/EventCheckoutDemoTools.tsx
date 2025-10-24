import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { FmEventSearchDropdown } from '@/components/ui/FmEventSearchDropdown';
import { FmCommonModal } from '@/components/ui/FmCommonModal';
import { Button } from '@/components/ui/button';
import { FmArtistSearchDropdown } from '@/components/ui/FmArtistSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/ui/FmVenueSearchDropdown';
import { FmCommonDatePicker } from '@/components/ui/FmCommonDatePicker';
import { FmCommonRowManager } from '@/components/ui/FmCommonRowManager';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label as FormLabel } from '@/components/ui/label';

interface EventCheckoutDemoToolsProps {
  selectedEventId: string | undefined;
  onEventChange: (eventId: string) => void;
}

interface UndercardArtist {
  artistId: string;
}

interface TicketTier {
  name: string;
  priceInCents: number;
  quantity: number;
  hideUntilPreviousSoldOut: boolean;
}

export const EventCheckoutDemoTools = ({
  selectedEventId,
  onEventChange,
}: EventCheckoutDemoToolsProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [headlinerId, setHeadlinerId] = useState<string>('');
  const [eventDate, setEventDate] = useState<Date>();
  const [venueId, setVenueId] = useState<string>('');
  const [undercardArtists, setUndercardArtists] = useState<UndercardArtist[]>([{ artistId: '' }]);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([
    { name: '', priceInCents: 0, quantity: 0, hideUntilPreviousSoldOut: false },
  ]);

  const handleSubmit = () => {
    console.log('Creating event:', {
      headlinerId,
      eventDate,
      venueId,
      undercardArtists,
      ticketTiers,
    });
    // TODO: Implement event creation
    setShowCreateModal(false);
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    // Reset form
    setHeadlinerId('');
    setEventDate(undefined);
    setVenueId('');
    setUndercardArtists([{ artistId: '' }]);
    setTicketTiers([{ name: '', priceInCents: 0, quantity: 0, hideUntilPreviousSoldOut: false }]);
  };

  return (
    <>
      <div className="space-y-3">
        <Label htmlFor="event-select" className="text-white">
          Select Event
        </Label>
        <FmEventSearchDropdown
          value={selectedEventId}
          onChange={onEventChange}
          onCreateNew={() => setShowCreateModal(true)}
          placeholder="Search for an event..."
        />
      </div>

      <FmCommonModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Create New Event"
        description="Set up a new event with ticket tiers and details"
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          {/* Headliner */}
          <div className="space-y-2">
            <FormLabel className="text-white">Headliner</FormLabel>
            <FmArtistSearchDropdown
              value={headlinerId}
              onChange={setHeadlinerId}
              placeholder="Search for headliner artist..."
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <FormLabel className="text-white">Date & Time</FormLabel>
            <FmCommonDatePicker
              value={eventDate}
              onChange={setEventDate}
              placeholder="Select event date and time"
            />
          </div>

          {/* Venue */}
          <div className="space-y-2">
            <FormLabel className="text-white">Venue</FormLabel>
            <FmVenueSearchDropdown
              value={venueId}
              onChange={setVenueId}
              placeholder="Search for venue..."
            />
          </div>

          {/* Undercard Artists */}
          <div className="space-y-2">
            <FormLabel className="text-white">Undercard Artists</FormLabel>
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
          </div>

          {/* Ticket Tiers */}
          <div className="space-y-2">
            <FormLabel className="text-white">Ticket Tiers</FormLabel>
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
                      <FormLabel className="text-white/70 text-xs">Name</FormLabel>
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
                      <FormLabel className="text-white/70 text-xs">Price ($)</FormLabel>
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
                      <FormLabel className="text-white/70 text-xs">Quantity</FormLabel>
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
                    <FormLabel htmlFor={`tier-${index}-hide`} className="text-white/70 text-sm cursor-pointer">
                      Hide until previous tier sold out
                    </FormLabel>
                  </div>
                </div>
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
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
        </div>
      </FmCommonModal>
    </>
  );
};
