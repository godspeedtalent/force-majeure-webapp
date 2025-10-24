import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FmCommonToggleHeader } from '@/components/ui/FmCommonToggleHeader';
import { FmCommonModal } from '@/components/ui/FmCommonModal';
import { FmArtistSearchDropdown } from '@/components/ui/FmArtistSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/ui/FmVenueSearchDropdown';
import { FmCommonDatePicker } from '@/components/ui/FmCommonDatePicker';
import { FmCommonRowManager } from '@/components/ui/FmCommonRowManager';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
  const [undercardArtists, setUndercardArtists] = useState<UndercardArtist[]>([{ artistId: '' }]);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([
    { name: '', priceInCents: 0, quantity: 0, hideUntilPreviousSoldOut: false },
  ]);

  const handleCreateEvent = () => {
    setIsModalOpen(true);
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
    setUndercardArtists([{ artistId: '' }]);
    setTicketTiers([{ name: '', priceInCents: 0, quantity: 0, hideUntilPreviousSoldOut: false }]);
  };

  return (
    <>
      <FmCommonToggleHeader title="Creation Tools">
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
      </FmCommonToggleHeader>

      <FmCommonModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Create New Event"
        description="Set up a new event with ticket tiers and details"
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          {/* Headliner */}
          <div className="space-y-2">
            <Label className="text-white">Headliner</Label>
            <FmArtistSearchDropdown
              value={headlinerId}
              onChange={setHeadlinerId}
              placeholder="Search for headliner artist..."
            />
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <Label className="text-white">Date & Time</Label>
            <FmCommonDatePicker
              value={eventDate}
              onChange={setEventDate}
              placeholder="Select event date and time"
            />
          </div>

          {/* Venue */}
          <div className="space-y-2">
            <Label className="text-white">Venue</Label>
            <FmVenueSearchDropdown
              value={venueId}
              onChange={setVenueId}
              placeholder="Search for venue..."
            />
          </div>

          {/* Undercard Artists */}
          <div className="space-y-2">
            <Label className="text-white">Undercard Artists</Label>
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
            <Label className="text-white">Ticket Tiers</Label>
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
