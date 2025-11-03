import { format } from 'date-fns';
import { Label } from '@/components/ui/shadcn/label';
import { Input } from '@/components/ui/shadcn/input';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { FmArtistSearchDropdown } from '@/components/ui/search/FmArtistSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/ui/search/FmVenueSearchDropdown';
import { FmCommonDatePicker } from '@/components/ui/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/ui/forms/FmCommonTimePicker';
import { EventFormState } from '../hooks/useEventData';

/**
 * EventDetailsSection Component
 *
 * Reusable form section for event basic details:
 * - Headliner selection
 * - Date and time
 * - Venue selection
 * - Hero image URL
 *
 * Shared between create and edit event flows.
 */

interface EventDetailsSectionProps {
  formState: EventFormState;
  setFormState: React.Dispatch<React.SetStateAction<EventFormState>>;
}

export const EventDetailsSection = ({ formState, setFormState }: EventDetailsSectionProps) => {
  const handleStartTimeChange = (time: string) => {
    if (formState.eventDate) {
      const [hours, minutes] = time.split(':');
      const newDate = new Date(formState.eventDate);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      setFormState((prev) => ({ ...prev, eventDate: newDate }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white">Headliner</Label>
        <FmArtistSearchDropdown
          value={formState.headlinerId}
          onChange={(value) => setFormState((prev) => ({ ...prev, headlinerId: value }))}
          placeholder="Search for headliner artist..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">Date</Label>
        <FmCommonDatePicker
          value={formState.eventDate}
          onChange={(value) => setFormState((prev) => ({ ...prev, eventDate: value }))}
          placeholder="Select event date"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white">Start Time</Label>
          <FmCommonTimePicker
            value={formState.eventDate ? format(formState.eventDate, 'HH:mm') : '20:00'}
            onChange={handleStartTimeChange}
            placeholder="Select start time"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white">End Time</Label>
          <FmCommonTimePicker
            value={formState.endTime}
            onChange={(value) => setFormState((prev) => ({ ...prev, endTime: value }))}
            disabled={formState.isAfterHours}
            placeholder="Select end time"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="after-hours"
          checked={formState.isAfterHours}
          onCheckedChange={(checked) =>
            setFormState((prev) => ({ ...prev, isAfterHours: checked === true }))
          }
        />
        <Label htmlFor="after-hours" className="text-white/70 cursor-pointer">
          After Hours Event
        </Label>
      </div>

      <div className="space-y-2">
        <Label className="text-white">Venue</Label>
        <FmVenueSearchDropdown
          value={formState.venueId}
          onChange={(value) => setFormState((prev) => ({ ...prev, venueId: value }))}
          placeholder="Search for venue..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">Hero Image URL</Label>
        <Input
          value={formState.heroImage}
          onChange={(e) => setFormState((prev) => ({ ...prev, heroImage: e.target.value }))}
          placeholder="https://example.com/image.jpg"
          className="bg-black/40 border-white/20 text-white"
        />
      </div>
    </div>
  );
};
