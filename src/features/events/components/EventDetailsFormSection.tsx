import { format } from 'date-fns';
import { Label } from '@/components/common/shadcn/label';
import { Input } from '@/components/common/shadcn/input';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/common/forms/FmCommonTimePicker';
import { EventFormState, EventFormActions } from '../hooks/useEventFormState';

interface EventDetailsFormSectionProps {
  state: EventFormState;
  actions: EventFormActions;
}

/**
 * EventDetailsFormSection
 *
 * Shared form section for event details (headliner, date/time, venue, hero image).
 * Used by both FmCreateEventButton and FmEditEventButton.
 */
export function EventDetailsFormSection({ state, actions }: EventDetailsFormSectionProps) {
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label className='text-white'>Headliner</Label>
        <FmArtistSearchDropdown
          value={state.headlinerId}
          onChange={actions.setHeadlinerId}
          placeholder='Search for headliner artist...'
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-white'>Date</Label>
        <FmCommonDatePicker
          value={state.eventDate}
          onChange={actions.setEventDate}
          placeholder='Select event date'
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label className='text-white'>Start Time</Label>
          <FmCommonTimePicker
            value={state.eventDate ? format(state.eventDate, 'HH:mm') : '20:00'}
            onChange={time => {
              if (state.eventDate) {
                const [hours, minutes] = time.split(':');
                const newDate = new Date(state.eventDate);
                newDate.setHours(parseInt(hours), parseInt(minutes));
                actions.setEventDate(newDate);
              }
            }}
            placeholder='Select start time'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-white'>End Time</Label>
          <FmCommonTimePicker
            value={state.endTime}
            onChange={actions.setEndTime}
            disabled={state.isAfterHours}
            placeholder='Select end time'
          />
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <Checkbox
          id='after-hours'
          checked={state.isAfterHours}
          onCheckedChange={checked => actions.setIsAfterHours(checked === true)}
        />
        <Label htmlFor='after-hours' className='text-white/70 cursor-pointer'>
          After Hours Event
        </Label>
      </div>

      <div className='space-y-2'>
        <Label className='text-white'>Venue</Label>
        <FmVenueSearchDropdown
          value={state.venueId}
          onChange={actions.setVenueId}
          placeholder='Search for venue...'
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-white'>Hero Image URL</Label>
        <Input
          value={state.heroImage}
          onChange={e => actions.setHeroImage(e.target.value)}
          placeholder='https://example.com/image.jpg'
          className='bg-black/40 border-white/20 text-white'
        />
      </div>
    </div>
  );
}
